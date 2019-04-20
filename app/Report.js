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

class Report extends React.Component {

  constructor(props, context) {
    super(props, context);

    this.state = {
      lines: [],
      orderBy: '2',
      sortDir: 'DESC'
    };
  }

  componentWillReceiveProps(newProps) {
    //
    // Run summary query to get data for this report.
    //
    if (newProps.groupBy == null) return;

    var data = new FormData();
    data.append('proc', 'breakdown');
    data.append('whereClause', newProps.whereClause);
    data.append('groupBy', newProps.groupBy);

    var orderBy = this.state.orderBy;
    if (orderBy != '') orderBy += ' ' + this.state.sortDir;
    data.append('orderBy', orderBy);

    fetch("mysql.php", {
      method: "POST",
      body: data
    }).then(function (response) {
      return response.ok ? response.text() : Promise.reject(response.status);
    }.bind(this)).then(function (result) {
      console.log(result);

      // var json = csvJSON(result);
      this.setState({ lines: eval(result) });
    }.bind(this));
  }

  shouldComponentUpdate(nextProps, nextState) {
    //
    // Don't do a render unless the info is here.
    //
    return true;
    /*(
         nextProps.groupBy != null
      // && nextState.lines.length != 0
      && nextProps.groupBy in nextState.lines[0]
      );
      */
  }

  sortReport(measure) {
    //
    // Set sort field and direction of sort.
    //
    var sameMeasure = measure == this.state.orderBy;
    var newDir = sameMeasure && this.state.sortDir == 'DESC' ? 'ASC' : 'DESC';
    this.setState({ orderBy: measure, sortDir: newDir });

    //
    // Get new data, once state is actually set.
    //
    setTimeout(function () {
      this.componentWillReceiveProps(this.props);
    }.bind(this), 0);
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

      this.props.measures.split(',').forEach(function (measure, i) {
        if (!(measure in minmax)) {
          minmax[measure] = {};
          minmax[measure].min = Number.MAX_VALUE;
          minmax[measure].max = Number.MAX_VALUE / 2 * -1;
          minmax[measure].total = 0;
        }
        minmax[measure].min = Math.min(minmax[measure].min, row[measure]);
        minmax[measure].max = Math.max(minmax[measure].max, row[measure]);
        minmax[measure].total += row[measure];
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
      var pc0 = -1;
      var measure_columns = this.props.measures.split(',').map(function (measure, i) {
        var pc = 100 * row[measure] / minmax[measure].max;
        if (pc0 == -1) pc0 = pc;
        var measureValue = row[measure];
        return React.createElement(
          "td",
          { className: "measure_cell", key: i },
          measureValue
        );
      });

      //
      // Store list of values for next/prev in dimension bar.
      //
      this.props.storeDimValues(this.props.groupBy, row[this.props.groupBy]);

      //
      // Assemble a line of the report.
      //
      return React.createElement(
        "tr",
        { key: i, className: "report_line", onClick: function () {
            this.props.addFilter(this.props.groupBy, row[this.props.groupBy]);
          }.bind(this) },
        React.createElement(
          "td",
          null,
          row[this.props.groupBy]
        ),
        React.createElement(
          "td",
          null,
          React.createElement("div", { style: { 'width': pc0 + '%', 'height': '18px' }, className: "bar" })
        ),
        measure_columns
      );
    }.bind(this));
  }

  render() {

    if (this.state.lines.length == 0) return React.createElement("div", null);

    var minmax = this.scanMeasures();
    var rows = this.generateReportRows(minmax);

    const upArrow = "\u25B4";
    const downArrow = "\u25Be";

    //
    // Create the column headers for metrics.
    //
    var measure_header = this.props.measures.split(',').map(function (measure, i) {

      var arrow = '';
      if (this.state.orderBy == measure || i == 0 && this.state.orderBy == '2') {
        arrow = this.state.sortDir == 'ASC' ? upArrow : downArrow;
      }
      return React.createElement(
        "th",
        { className: "report_heading",
          onClick: function () {
            this.sortByMeasure(measure);
          }.bind(this), key: i },
        measure,
        " ",
        arrow,
        " "
      );
    }.bind(this));

    var arrow = '';
    if (this.state.orderBy == '1' || this.state.orderBy == this.props.groupBy) {
      arrow = this.state.sortDir == 'ASC' ? upArrow : downArrow;
    }

    //
    // Assemble the report.
    //
    return React.createElement(
      "div",
      { className: "report_div" },
      React.createElement(
        "table",
        null,
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement(
              "th",
              { className: "report_heading", style: { 'minWidth': '300px' },
                onClick: this.sortByGroupBy.bind(this) },
              this.props.groupBy,
              " ",
              arrow
            ),
            React.createElement("th", { width: "200" }),
            measure_header
          ),
          rows
        )
      ),
      React.createElement(Detail, { whereClause: this.props.whereClause })
    );
  }
}