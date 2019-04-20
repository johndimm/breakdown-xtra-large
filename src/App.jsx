const React = window.React;
const ReactDOM = window.ReactDOM;


class App extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.dimValues = {};
    this.filterStack = [];

    this.state = {
      settings: {
           fact_table: '',
           summary_table: '',
           dimensions: '',
           measures: '',
           aggregates: '',
           page_title: ''
       },
      report: {
           group_by: '',
           order_by: '',
           filters: {},
           dimCounts: {}
      }
    };
  }

  componentDidMount() {
    //
    // Get global settings.
    //
    var data = new FormData();
    data.append ('proc','get_breakdown_settings');
    data.append('param','');

    fetch("mysql.php",{
      method: "POST",
      body: data
    })
      .then(function (response) {
          return response.json();
    }).then(function (result) {
          this.setState({settings: result[0]});
          this.setGroupby(this.state.settings.dimensions.split(',')[0]);
          this.getDimCounts();
    }.bind(this));
  }

  setGroupby(row) {
    //
    // Set the first column of the report, the field we will group by.
    //
    var report = this.state.report;
    report.groupBy = row;
    this.setState({report: report});
  }

  whereClause() {
     //
     // Serialize the array of filters into a SQL WHERE clause.
     //
     var filter_array = [];
     Object.getOwnPropertyNames(this.state.report.filters).forEach(function(row, i) {
        filter_array.push(row + " = '" + this.state.report.filters[row] + "'")
     }.bind(this));
     return filter_array.join(' AND ');
  }

  nextDimension(dim) {
    //
    // Find the next dimension, wrapping around.
    //
    var acol = this.state.settings.dimensions.split(',');
    var i = acol.indexOf(dim);
    i = (i + 1) % acol.length;
    return acol[i];
  }

  addFilter(key, value, bStayPut) {
    //
    // Add this key/value to the list of filters.
    //
    var report = this.state.report;
    report.filters[key] = value;
    if (bStayPut == null || !bStayPut)
      report.groupBy = this.nextDimension(key);
    this.setState({report : report});

    this.getDimCounts();

    this.filterStack.push(key);
  }

  removeFilter(key) {
    //
    // Remove a filter and group by the same field.
    //
    var report = this.state.report;
    delete report.filters[key];
    report.groupBy = key;
    this.setState({report : report});

    this.getDimCounts();

    var idx = this.filterStack.indexOf(key);
    this.filterStack.splice(idx, 1);
  }

  slideDim(dimension, value, increment) {
    var idx = this.dimValues[dimension].indexOf(value);
    var newIdx = (idx + increment) % this.dimValues[dimension].length;
    if (newIdx < 0) newIdx = this.dimValues[dimension].length - 1;
    var newValue = this.dimValues[dimension][newIdx];
    this.addFilter(dimension, newValue, true);
  }

  getDimCounts() {
    var dims = this.state.settings.dimensions.split(',');
    dims.map(function(key, i) {
      dims[i] = "count(distinct " + key + ") as " + key;
    });
    var countDistinct = dims.join(",");

    var whereClause = this.whereClause();

    var data = new FormData();
    data.append ('proc','dim_counts');
    data.append('countDistinct',countDistinct);
    data.append('whereClause', whereClause);

    fetch("mysql.php",{
      method: "POST",
      body: data
    })
      .then(function (response) {
          return response.json();
    }).then(function (result) {
        var report = this.state.report;
        report.dimCounts = result[0];
        this.setState({report: report});
    }.bind(this));
  }

  storeDimValues(key, val) {
    if (! (key in this.dimValues))
      this.dimValues[key] = [];
    this.dimValues[key].push(val);
  }

  clearDimValues(key) {
    this.dimValues[key] = [];
  }

  render() {

    //
    // Create the dimension bar on the left side of the page.
    //
    var dimensions = this.state.settings.dimensions.split(',').map (function(row, i) {
      var selectedValue = this.state.report.filters[row];
      var isGroupby = row == this.state.report.groupBy;
      var count = '';
      if (this.state.report.dimCounts != null) {
          if (row in this.state.report.dimCounts
             && this.state.report.dimCounts[row] > 1) {
            count = this.state.report.dimCounts[row];
          }
      }
      var dimValues = [];
      if (row in this.dimValues) {
        dimValues = this.dimValues[row];
      }
      return (
        <Dimension
          key={i}
          setGroupby={function() {this.setGroupby(row)}.bind(this)}
          removeFilter={function() {this.removeFilter(row)}.bind(this)}
          name={row}
          isGroupby={isGroupby}
          count={count}
          dimValues={dimValues}
          selectedValue={selectedValue}
          addFilter={this.addFilter.bind(this)}
          slideDim={this.slideDim.bind(this)}
          lastFilter={this.filterStack[this.filterStack.length-1]}
          />
      );
    }.bind(this));

    var whereClause = this.whereClause();
    var orderBy = "2 DESC";

    //
    // Assemble the page.
    //
    return (
      <div>
          <h1>{this.state.settings.page_title}</h1>
          <div className='dimensions_div'>{dimensions}</div>
          <Report groupBy={this.state.report.groupBy}
                  whereClause={whereClause}
                  orderBy={orderBy}
                  measures={this.state.settings.measures}
                  summary_table={this.state.settings.summary_table}
                  measures={this.state.settings.measures}
                  addFilter={this.addFilter.bind(this)}
                  storeDimValues={this.storeDimValues.bind(this)}
                  clearDimValues={this.clearDimValues.bind(this)}
           />
       </div>
    );
  }
}


function renderRoot() {
  var domContainerNode = window.document.getElementById('root');
  ReactDOM.unmountComponentAtNode(domContainerNode);
  ReactDOM.render(<App />, domContainerNode);
}

$(document).ready (function() {
  renderRoot();
});


