/*
 * Copyright 2019 John Dimm -- All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license.
 */

const React = window.React;
const ReactDOM = window.ReactDOM;

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


class Banner extends React.Component {
  render() {

    if (this.props.current_source == null)
      return (<div></div>);

    // var source = this.props.source_set[this.props.current_source];
    var source = this.props.source;

    var cell1 = (
      <div>
        <div className='title_div'>{source.page_title}</div>
        <div className='subtitle_div'>{source.description}</div>
        <div className='about_div'>About:&nbsp;
           <a target="_blank" href={source.url}>datasource</a>
           &nbsp;|&nbsp;
           <a target="_blank" href="https://github.com/johndimm/breakdown">code</a>
         </div>
      </div>
    );



    var button_text = this.props.show_summary ? 'Detail' : 'Summary';
    var cell3 = (<button onClick={
          this.props.toggleSummary
      }>show {button_text}</button>);

    return (
      <table className='banner'>
        <tbody>
          <tr>
            <td className='title_cell'>{cell1}</td>
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
//    this.source_set = {};


    this.state = {
      current_setting: 'forbes',
      source: {
           database: 'mysql',
           name: '',
           fact_table: '',
           summary_table: '',
           dimensions: '',
           dim_metadata_table: '',
           dim_metadata: {},
           d_array: [],
           measures: '',
           m_array: [],
           aggregates: '',
           page_title: ''
       },
      report: {
           groupBy: '',
           orderBy: '',
           filters: {},
           dimCounts: {},
           show_summary: true
      }
    };

    $('head').append("<style id='grayed_out'> .grayed_out { color: #AAAAAA } </style>");
  }

  componentWillReceiveProps(newProps) {
    if (this.props.source != newProps.source && newProps.source != null)
      this.setSource(newProps.source);
  }

  setSource(source) {

    if (isEmptyObject(source))
      return false;

    var current_source=source['name'];
    if (current_source == '')
      return false;

    this.setState({current_source: current_source});

    this.dimValues = {};
    this.filterStack = [];
    Database = source.database == 'mysql' ? mysql : lovefield;

    var report = this.state.report;
    report.filters = {};
    report.dimCounts = {};
    report.orderBy = '';

    var dimArray = source.dimensions.split(',');
    report.groupBy = dimArray[0];


    if (source.database != 'mysql') {

       lovefield.setSource(source);

       Database.queryCounts(dimArray, this.whereClause(), current_source, function(results) {
       report.dimCounts = results;
       this.setState({
         source: source,
         report: report
       });
      }.bind(this));

    } else {

    Database.queryCounts(dimArray, this.whereClause(), current_source, function(results) {
      report.dimCounts = results;
      this.setState({
        source: source,
        report: report
      });
    }.bind(this));

    }

    return true;
  }

  setGroupby(row) {
    //
    // Set the first column of the report, the field we will group by.
    //
    if (this.state.report.dimCounts[row] > 1000)
      return;

    var report = this.state.report;
    report.groupBy = row;
    report.show_summary = true;
    this.setState({report: report});
  }

  getDimCounts() {
    Database.queryCounts(this.getDimArray(), this.whereClause(), this.state.current_source, function(results) {
      var report = this.state.report;
      report.dimCounts = results;
      this.setState({report: report});
      console.log(results);
    }.bind(this));
  }

    getDimArray() {
      return   this.state.source.dimensions.split(',');
  }

  whereClause() {
     //
     // Serialize the array of filters into a SQL WHERE clause.
     //
     var filter_array = [];
     if (this.state.report.filters != null)
     Object.getOwnPropertyNames(this.state.report.filters).forEach(function(row, i) {
        filter_array.push("`" + row + "` = '" + this.state.report.filters[row].replace("'","''") + "'")
     }.bind(this));

     return filter_array.join(' AND ');
  }



  nextDimension(dim) {
    //
    // Find the next dimension, wrapping around.
    //
    var acol = this.getDimArray();
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

    if (isEmptyObject(this.props.source))
      return null;


    //
    // Create the dimension bar on the left side of the page.
    //
    var dimensions = this.getDimArray().map (function(row, i) {
      var selectedValue = this.state.report.filters[row];
      var isGroupby = row == this.state.report.groupBy && row != '';
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

      var title = '';
      if (! isEmpty(this.state.source.dim_metadata) && row in this.state.source.dim_metadata)
        title = this.state.source.dim_metadata[row];

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
          source={this.state.current_source}
          title={title}
          />
      );
    }.bind(this));

    var whereClause = this.whereClause();
    var orderBy = this.state.report.orderBy || "2 DESC";

    var report = (
              <Report groupBy={this.state.report.groupBy}
                  whereClause={whereClause}
                  orderBy={orderBy}

                  measures={this.state.source.measures}
                  aggregates={this.state.source.aggregates}
                  summary_table={this.state.source.summary_table}

                  addFilter={this.addFilter.bind(this)}
                  storeDimValues={this.storeDimValues.bind(this)}
                  clearDimValues={this.clearDimValues.bind(this)}

                  source={this.state.current_source}
           />
    );

    var detail =  // (<div></div>);
     (<Detail whereClause={whereClause} orderBy={orderBy} source={this.state.current_source}/>);

    //
    // Always keep the Report, so we don't have to reread the data if you switch back to summary.
    // Just make it invisible.
    //
    var right_side = (<div></div>);
    if (this.state.report.show_summary) {
      $("#report_div").css("display", "block");
    } else {
      $("#report_div").css("display", "none");
      right_side = detail;
    }

    //
    // Assemble the page.
    //
    return (
      <div id="breakdown">
          <Banner current_source={this.state.current_source}
            source={this.props.source}
            toggleSummary={this.toggleSummary.bind(this)}
            show_summary={this.state.report.show_summary}
            />

          <table className="content"><tbody><tr>

          <td>
          <div className='dimensions_div'>
            {dimensions}
          </div>
          </td>

          <td>
          {report}
          {right_side}
          </td>

          </tr></tbody></table>
       </div>
    );
  }
}

function getRequestedSource() {
    //
    // Search URL Params for param named 'source'.
    //
    var param = window.location.search.replace("?",'');
    var pairs = param.split("&");
    var source = '';
    pairs.forEach(function(key, i) {
       var parts = key.split("=");
       if (parts[0] == 'source') {
          source = parts[1];
       }
     } .bind(this));

     return source;
}



function isEmptyObject(obj) {
    return obj == null || (Object.entries(obj).length === 0 && obj.constructor === Object);
}

function renderRoot() {
  var domContainerNode = window.document.getElementById('root');
//  ReactDOM.unmountComponentAtNode(domContainerNode);
  ReactDOM.render(<Catalog />, domContainerNode);
}

$(document).ready (function() {

  lovefield = new Lovefield();
  mysql = new Mysql();
  Database = mysql;

  mysql.init();
  // lovefield.init();

  // renderRoot();
});


