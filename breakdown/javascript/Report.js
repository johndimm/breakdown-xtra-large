/*
 * Copyright 2019 John Dimm -- All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license.
 */
//
// Utility fundtion to convert from csv to json.
// Allows transfer of more compact csv format.
//
function csvJSON(csv) {
  var lines = csv.split("\n");
  var result = [];
  var headers = lines[0].split("\t");

  for (var i = 1; i < lines.length; i++) {
    var obj = {};
    var currentline = lines[i].split("\t");

    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    result.push(obj);
  }

  return result;
}

function formatNumber(num) {
  if (num == null) return 0;else return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

function formatDollars(num) {
  if (num == null) return 0;else {
    var commas = num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

    if (num > 0) {
      return "+ $" + commas;
    } else {
      return "- $" + commas.substr(1, commas.length - 1);
    }
  }
}

class Bar extends React.Component {
  render() {
    return React.createElement("td", {
      className: "bar_holder"
    }, React.createElement("table", {
      className: "bar_table"
    }, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
      style: {
        'width': this.props.pcMaxNeg + "%"
      }
    }, React.createElement("div", {
      style: {
        'width': this.props.pc0Neg + '%',
        'height': '18px',
        'backgroundColor': 'red',
        'float': 'right'
      },
      className: "bar"
    })), React.createElement("td", {
      style: {
        'width': this.props.pcMaxPos + "%"
      }
    }, React.createElement("div", {
      style: {
        'width': this.props.pc0Pos + '%',
        'height': '18px'
      },
      className: "bar"
    }))))));
  }

}

class Report extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      lines: [],
      orderBy: '2',
      sortDir: 'DESC',
      dataset: ''
    };
  } //  componentDidMount() {
  //    this.componentWillReceiveProps(this.props);
  //  }


  componentWillReceiveProps(newProps) {
    //
    // Run summary query to get data for this report.
    //
    //    if (newProps.groupBy == null) //  || newProps.groupBy == this.props.groupBy)
    //      return;
    //  return;
    //   if (newProps.dataset != this.state.dataset) {
    //     this.setState({dataset: newProps.dataset, orderBy: '2', sortDir: 'DESC'});
    //   }
    var data = new FormData();
    data.append('proc', 'breakdown');
    data.append('whereClause', newProps.whereClause);
    data.append('groupBy', newProps.groupBy);
    data.append('dataset', newProps.dataset);
    data.append('aggregates', newProps.aggregates);

    if (this.state.orderBy == '2') {
      this.setState({
        orderBy: newProps.measures[0]
      });
    }

    var orderBy = this.state.orderBy;
    if (orderBy != '') orderBy += ' ' + this.state.sortDir;
    data.append('orderBy', orderBy);
    console.log('breakdown, data:' + data); // Get the same info from lovefield or mysql.

    Database.breakdown(data, function (result) {
      this.setState({
        dataset: newProps.dataset,
        lines: result
      });
      console.log(result[0]);
    }.bind(this));
  }

  shouldComponentUpdate(nextProps, nextState) {
    //
    // Don't do a render unless the info is here.
    //
    // return true;
    return nextProps.groupBy != null && nextState.lines.length != 0 && nextProps.groupBy in nextState.lines[0];
  }

  sortReport(measure) {
    //
    // Set sort field and direction of sort.
    //
    var sameMeasure = measure == this.state.orderBy;
    var newDir = sameMeasure && this.state.sortDir == 'DESC' ? 'ASC' : 'DESC';
    this.setState({
      orderBy: measure,
      sortDir: newDir
    }, function () {
      this.componentWillReceiveProps(this.props);
    }.bind(this));
  }

  sortByMeasure(measure) {
    this.sortReport(measure);
  }

  sortByGroupBy() {
    this.sortReport('1');
  }

  scanMeasures() {
    //
    // Find the range of each measure.
    //
    var minmax = {};
    this.state.lines.forEach(function (row, i) {
      this.props.measures.forEach(function (measure, i) {
        if (!(measure in minmax)) {
          minmax[measure] = {};
          minmax[measure].min = Number.MAX_VALUE;
          minmax[measure].max = Number.MAX_VALUE / 2 * -1;
          minmax[measure].total = 0;
        }

        minmax[measure].min = Math.min(minmax[measure].min, row[measure]);
        minmax[measure].max = Math.max(minmax[measure].max, row[measure]);
        minmax[measure].total += parseFloat(row[measure]);
      });
    }.bind(this));
    return minmax;
  }

  generateReportRows(minmax) {
    this.props.clearDimValues(this.props.groupBy);
    return this.state.lines.map(function (row, i) {
      //
      // Generate table cells for the measures in a line.
      //
      var pcMaxPos, pcMaxNeg, pc0Pos, pc0Neg;
      var measure_columns = this.props.measures.map(function (measure, i) {
        var mval = row[measure];

        if (i == 0) {
          //
          // Bars are for the first measure only.
          //
          var neg = Math.max(0, -1 * minmax[measure].min);
          var pos = Math.max(0, minmax[measure].max);
          pc0Pos = 0;
          pc0Neg = 0;
          if (mval >= 0) pc0Pos = Math.max(0, 100 * mval / pos);
          if (mval < 0) pc0Neg = Math.max(0, 100 * -1 * mval / neg);
          pcMaxPos = 100 * pos / (pos + neg);
          pcMaxNeg = 100 - pcMaxPos;
          pc0Pos = Math.round(pc0Pos, 2);
          pc0Neg = Math.round(pc0Neg, 2);
          pcMaxPos = Math.round(pcMaxPos, 2);
          pcMaxNeg = Math.round(pcMaxNeg, 2);
        }

        var style;
        var num;

        if (measure == 'Amount') {
          num = formatDollars(mval);
          style = {
            'color': mval > 0 ? 'darkgreen' : 'black'
          };
        } else {
          style = {
            'color': 'black'
          };
          num = formatNumber(mval);
        }

        ;

        if (mval == 0) {
          num = '$0';
          style = {};
        }

        return React.createElement("td", {
          className: "measure_cell",
          key: i,
          style: style
        }, num);
      }); //
      // Store list of values for next/prev in dimension bar.
      //

      this.props.storeDimValues(this.props.groupBy, row[this.props.groupBy]); //
      // Assemble a line of the report.
      //

      return React.createElement("tr", {
        key: i,
        className: "report_line",
        onClick: function () {
          this.props.addFilter(this.props.groupBy, row[this.props.groupBy]);
        }.bind(this)
      }, React.createElement("td", null, row[this.props.groupBy]), React.createElement(Bar, {
        pc0Pos: pc0Pos,
        pc0Neg: pc0Neg,
        pcMaxPos: pcMaxPos,
        pcMaxNeg: pcMaxNeg
      }), measure_columns);
    }.bind(this));
  }

  generateTotals(minmax) {
    var measure_columns = this.props.measures.map(function (measure, i) {
      if (measure == '') return React.createElement("td", {
        key: i
      });else {
        var style;
        var num;

        if (measure == 'Amount') {
          var val = minmax[measure].total;
          num = formatDollars(val);
          style = {
            'color': val > 0 ? 'darkgreen' : 'black'
          };
        } else {
          var style = {
            'color': 'black'
          };
          var num = formatNumber(minmax[measure].total);
        }

        return React.createElement("td", {
          className: "measure_cell",
          key: i,
          style: style
        }, num);
      }
    }.bind(this));
    return React.createElement("tr", null, React.createElement("td", {
      style: {
        'borderRight': 'none'
      }
    }), React.createElement("td", {
      style: {
        'borderLeft': 'none'
      }
    }, "Totals:"), measure_columns);
  }

  render() {
    if (this.state.lines.length == 0) return React.createElement("div", null);
    var minmax = this.scanMeasures();
    var rows = this.generateReportRows(minmax);
    var totals = this.generateTotals(minmax);
    const upArrow = "\u25B4";
    const downArrow = "\u25Be"; //
    // Create the column headers for metrics.
    //

    var measure_header = this.props.measures.map(function (measure, i) {
      var arrow = '';

      if (this.state.orderBy == measure || i == 0 && this.state.orderBy == '2') {
        arrow = this.state.sortDir == 'ASC' ? upArrow : downArrow;
      }

      return React.createElement("th", {
        className: "report_heading",
        onClick: function () {
          this.sortByMeasure(measure);
        }.bind(this),
        key: i
      }, measure, " ", arrow, " ");
    }.bind(this));
    var arrow = '';

    if (this.state.orderBy == '1' || this.state.orderBy == this.props.groupBy) {
      arrow = this.state.sortDir == 'ASC' ? upArrow : downArrow;
    } //
    // Assemble the report.
    //


    return React.createElement("div", {
      id: "report_div"
    }, React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("th", {
      className: "report_heading",
      style: {
        'minWidth': '300px'
      },
      onClick: this.sortByGroupBy.bind(this)
    }, this.props.groupBy, " ", arrow), React.createElement("th", {
      className: "report_heading",
      width: "200"
    }), measure_header), rows, totals)));
  }

}