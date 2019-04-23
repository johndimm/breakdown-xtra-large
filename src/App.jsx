const React = window.React;
const ReactDOM = window.ReactDOM;


class Banner extends React.Component {
  render() {

    if (this.props.current_settings == null)
      return (<div></div>);

    var settings = this.props.settings_sets[this.props.current_settings];

    var cell1 = (
      <div>
        <div className='title_div'>{settings.page_title}</div>
        <div className='subtitle_div'>{settings.description}</div>
      </div>
    );

    var cell2 = Object.keys(this.props.settings_sets).map(function(key, i) {

      var page_title = this.props.settings_sets[key].page_title;
      var description = this.props.settings_sets[key].description;
      var url = this.props.settings_sets[key].url;
      return (
        <li key={i}>
        <span className='source_li'
          onClick={function() { this.props.setSettings(key);}.bind(this)}>{page_title}</span>
          : <a href={url}>source</a>
        </li>
      )
    }.bind(this));

    var button_text = this.props.show_summary ? 'Detail' : 'Summary';
    var cell3 = (<button onClick={this.props.toggleSummary}>show {button_text}</button>);

    return (
      <table className='banner'>
        <tbody>
          <tr>
            <td className='title_cell'>{cell1}</td>
            <td className='menu_cell'><ul>{cell2}</ul></td>
            <td className='toggle_cell'>{cell3}</td>
          </tr>
        </tbody>
      </table>
    );
  }
}

class App extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.dimValues = {};
    this.filterStack = [];
    this.settings_sets = [];

    this.state = {
      current_setting: 'olympic_medals',
      settings: {
           name: '',
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
           dimCounts: {},
           show_summary: true
      }
    };
  }

  componentWillMount() {
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
          var name = '';
          for (var i=0; i<result.length; i++) {
            var r = result[i];
            this.settings_sets[r.name] = r
            name = r.name
          }

          if (name != '')
            this.setSettings(name);

    }.bind(this));
  }

  setSettings(name) {
    var settings = this.state.settings;
    settings = this.settings_sets[name];
    var report = this.state.report;
    report.filters = {};
    this.setState({settings:settings, current_settings:name, report: report});
    setTimeout(function() {


      this.setGroupby(this.state.settings.dimensions.split(',')[0]);
      this.getDimCounts();

    }.bind(this), 0);
  }

  setGroupby(row) {
    //
    // Set the first column of the report, the field we will group by.
    //
    var report = this.state.report;
    report.groupBy = row;
    report.show_summary = true;
    this.setState({report: report});
  }

  whereClause() {
     //
     // Serialize the array of filters into a SQL WHERE clause.
     //
     var filter_array = [];
     Object.getOwnPropertyNames(this.state.report.filters).forEach(function(row, i) {
        filter_array.push(row + " = '" + this.state.report.filters[row].replace("'","''") + "'")
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
    // report.show_summary = true;
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
    data.append('source', this.state.current_settings);

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

  toggleSummary() {
    var report = this.state.report;
    report.show_summary = ! report.show_summary;
    this.setState({ report: report });
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
          source={this.state.current_settings}
          />
      );
    }.bind(this));

    var whereClause = this.whereClause();
    var orderBy = "2 DESC";

    var report = (
              <Report groupBy={this.state.report.groupBy}
                  whereClause={whereClause}
                  orderBy={orderBy}
                  measures={this.state.settings.measures}
                  summary_table={this.state.settings.summary_table}
                  measures={this.state.settings.measures}
                  addFilter={this.addFilter.bind(this)}
                  storeDimValues={this.storeDimValues.bind(this)}
                  clearDimValues={this.clearDimValues.bind(this)}
                  source={this.state.current_settings}
           />
    );

    var detail = (
               <Detail whereClause={whereClause} orderBy={orderBy} source={this.state.current_settings}/>
    )

    var right_side = this.state.report.show_summary ? report : detail;


    //
    // Assemble the page.
    //
    return (
      <div>
          <Banner current_settings={this.state.current_settings}
            settings_sets={this.settings_sets}
            setSettings={this.setSettings.bind(this)}
            toggleSummary={this.toggleSummary.bind(this)}
            show_summary={this.state.report.show_summary}
            />

          <div className='dimensions_div'>
            {dimensions}
          </div>

          {right_side}

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


