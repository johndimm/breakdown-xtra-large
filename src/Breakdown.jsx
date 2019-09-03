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
   onCarriageReturn(event) {
     	var keycode = (event.keyCode ? event.keyCode : event.which);
     	 if(keycode == '13'){
     		  this.props.refresh_search();
     	 }
  }


  render() {

    if (this.props.current_dataset == null)
      return (<div></div>);

    // var dataset = this.props.dataset_set[this.props.current_dataset];
    var dataset = this.props.dataset;

    var cell1 = (
      <div>
        <div className='title_div'>{dataset.page_title}</div>
        <div className='subtitle_div'>{dataset.description}</div>
        <div className='about_div'>
           <a target="_blank" href="guide.html">guide</a>
           &nbsp;|&nbsp;
           <a target="_blank" href="https://github.com/johndimm/breakdown">code</a>
           &nbsp;|&nbsp;
           <a href="index.html?dataset=foo">import</a>
         </div>
      </div>
    );



    var button_text = this.props.show_summary ? 'Detail' : 'Summary';
    var cell3 = (
      <div>
         Description: <input id="search_description"
         onKeyPress={this.onCarriageReturn.bind(this)}
         type="text" width="25" />
          &nbsp; <button id="search_text_button"
          onClick={this.props.refresh_search}>
          &#x1F50D;
          </button>
        &nbsp;
        <button  onClick={
          this.props.toggleSummary
        }>show {button_text}</button>
      </div>
      );

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

class Breakdown extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.dimValues = {};
    this.filterStack = [];


    this.state = {
      dataset: {
           database: 'mysql',
           name: '',
           fact_table: '',
           summary_table: '',
           dimensions: [],
//           dim_metadata_table: '',
//           dim_metadata: {},
           measures: [],
           aggregates: '',
           page_title: ''
       },
      report: {
           groupBy: '',
           orderBy: '',
           filters: {},
           dimCounts: {},
           show_summary: true,
           searchText: ''
      }
    };

//    $('head').append("<style id='grayed_out'> .grayed_out { color: #AAAAAA } </style>");
  }

  componentWillReceiveProps(newProps) {
    if (this.props.dataset != newProps.dataset && newProps.dataset != null)
      this.setSource(newProps.dataset);
  }

  setSource(dataset) {

    if (isEmptyObject(dataset))
      return false;

    var current_dataset=dataset['name'];
    if (current_dataset == '')
      return false;

    this.setState({current_dataset: current_dataset});

    this.dimValues = {};
    this.filterStack = [];
    Database = dataset.database == 'mysql' ? mysql : lovefield;

    var report = this.state.report;
    report.filters = {};
    report.dimCounts = {};
    report.orderBy = '';

    report.groupBy = dataset.dimensions[0];

    if (dataset.database != 'mysql') {

       lovefield.setSource(dataset);

       Database.queryCounts(dataset.dimensions, this.whereClause(), current_dataset, function(results) {
       report.dimCounts = results;
       this.setState({
         dataset: dataset,
         report: report
       });
      }.bind(this));

    } else {

    Database.queryCounts(dataset.dimensions, this.whereClause(), current_dataset, function(results) {
      report.dimCounts = results;
      this.setState({
        dataset: dataset,
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
    Database.queryCounts(this.getDimArray(), this.whereClause(), this.state.current_dataset, function(results) {
      var report = this.state.report;
      report.dimCounts = results;
      this.setState({report: report});
      console.log(results);
    }.bind(this));
  }

  getDimArray() {
      return   this.state.dataset.dimensions; // .split(',');
  }

  whereClause() {
     //
     // Serialize the array of filters into a SQL WHERE clause.
     //
     var filter_array = [];
     if (this.state.report.filters != null)
     Object.getOwnPropertyNames(this.state.report.filters).forEach(function(row, i) {
        filter_array.push("`" + row + "` = '" + this.state.report.filters[row].replace("'","\\'") + "'")
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

  refreshSearch() {
    var searchText = $("#search_description").val();
    if (searchText != this.state.report.searchText) {
      var report = this.state.report;
      report.searchText = searchText;
      this.setState({report: report});
      setTimeout(function() {this.getDimCounts()}.bind(this), 0);
    }

    // Set progress cursor.
    $('body').addClass('waiting');
  }

  render() {

    if (isEmptyObject(this.props.dataset))
      return null;

    $("#dataset_catalog_context_switch").css("display", "block");

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
      if (! isEmpty(this.state.dataset.dim_metadata) && row in this.state.dataset.dim_metadata)
        title = this.state.dataset.dim_metadata[row];

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
          dataset={this.state.current_dataset}
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

                  measures={this.state.dataset.measures}
                  aggregates={this.state.dataset.aggregates}
                  summary_table={this.state.dataset.summary_table}

                  addFilter={this.addFilter.bind(this)}
                  storeDimValues={this.storeDimValues.bind(this)}
                  clearDimValues={this.clearDimValues.bind(this)}

                  dataset={this.state.current_dataset}
           />
    );

    var detail =  // (<div></div>);
     (<Detail whereClause={whereClause} orderBy={orderBy} dataset={this.state.current_dataset}/>);

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
          <Banner current_dataset={this.state.current_dataset}
            dataset={this.props.dataset}
            toggleSummary={this.toggleSummary.bind(this)}
            show_summary={this.state.report.show_summary}
            refresh_search={this.refreshSearch.bind(this)}
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
    return urlparam('dataset', '');
}

function urlparam(key, defaultValue) {
      //
    // Search URL Params for param named key.
    //
    var param = window.location.search.replace("?",'');
    var pairs = param.split("&");
    var val = '';
    pairs.forEach(function(pair, i) {
       var parts = pair.split("=");
       if (parts[0] == key) {
          val = parts[1];
       }
     });

     return val;
}



function isEmptyObject(obj) {
    return obj == null || (Object.entries(obj).length === 0 && obj.constructor === Object);
}




