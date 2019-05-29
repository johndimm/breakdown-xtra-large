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

    var source = this.props.source_set[this.props.current_source];

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

    var cell2 =
      Object.keys(this.props.source_set).map(function(key, i) {
          var page_title = this.props.source_set[key].page_title;
          var description = this.props.source_set[key].description;
          var url = this.props.source_set[key].url;
          return (
            <li key={i}>
            <span className='source_li'
              onClick={function() { this.props.setSource(key);}.bind(this)}>{page_title}</span>
            </li>
          )
        }.bind(this));

    if (cell2.length < 2) cell2 = (<div></div>);

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
    this.source_set = [];

    this.state = {
      current_setting: 'olympics',
      source: {
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
    // Get global sources.
    //
    var data = new FormData();
    data.append ('proc','get_breakdown_sources');
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

            // Fix measures to work as params.
            r.m_array = r.measures.split(",");
            r.d_array = r.dimensions.split(",");
            r.d_array = r.d_array.map(function(key, i) {
              return "'" + r.d_array[i].trim() + "'";
            });

            this.source_set[r.name] = r
            if (r.dim_metadata_table != '')
              this.getDimMetadata(r.name, r.dim_metadata_table)
            else
              name = r.name
          }

          if (name != '')
           this.setSource(name);

    }.bind(this));
  }

  getDimMetadata(source_set_name, dim_metadata_table) {
    var data = new FormData();
    data.append ('proc','get_dim_metadata');
    data.append('param', dim_metadata_table);

    fetch("mysql.php",{
      method: "POST",
      body: data
    })
      .then(function (response) {
          return response.json();
    }).then(function (result) {

      var dim_metadata = {};

      result.forEach(function(key, i) {
          dim_metadata[key.name] = key.metadata;
      });
      this.source_set[source_set_name].dim_metadata = dim_metadata;

      // Set source here for one with metadata.
      this.setSource(source_set_name);

    }.bind(this)
    );

  }

  setSource(name) {
    // var source = this.state.source;
    var source = this.source_set[name];
    var report = this.state.report;

    this.dimValues = {};
    this.filterStack = [];

    report.filters = {};
    report.dimCounts = {};
    report.order_by = '';
    report.group_by = '';

    this.setState({source:source, current_source:name, report: report},
     function() {
      this.setGroupby(this.state.source.dimensions.split(',')[0]);
      this.getDimCounts();
      this.getDimMetadata();
    }.bind(this));

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
        filter_array.push("`" + row + "` = '" + this.state.report.filters[row].replace("'","''") + "'")
     }.bind(this));
     return filter_array.join(' AND ');
  }

  nextDimension(dim) {
    //
    // Find the next dimension, wrapping around.
    //
    var acol = this.state.source.dimensions.split(',');
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
    var dims = this.state.source.dimensions.split(',');
    dims.map(function(key, i) {
      dims[i] = "count(distinct `" + key + "`) as `" + key + "`";
    });
    var countDistinct = dims.join(",");

    var whereClause = this.whereClause();

    var data = new FormData();
    data.append ('proc','dim_counts');
    data.append('countDistinct',countDistinct);
    data.append('whereClause', whereClause);
    data.append('source', this.state.current_source);

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
    var dimensions = this.state.source.dimensions.split(',').map (function(row, i) {
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
    var orderBy = "2 DESC";

    var report = (
              <Report groupBy={this.state.report.groupBy}
                  whereClause={whereClause}
                  orderBy={orderBy}

                  measures={this.state.source.measures}
                  summary_table={this.state.source.summary_table}

                  addFilter={this.addFilter.bind(this)}
                  storeDimValues={this.storeDimValues.bind(this)}
                  clearDimValues={this.clearDimValues.bind(this)}

                  source={this.state.current_source}
           />
    );

    var detail = (
               <Detail whereClause={whereClause} orderBy={orderBy} source={this.state.current_source}/>
    )

    var right_side = this.state.report.show_summary ? report : detail;

    //
    // Assemble the page.
    //
    return (
      <div>
          <Banner current_source={this.state.current_source}
            source_set={this.source_set}
            setSource={this.setSource.bind(this)}
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
          {right_side}
          </td>

          </tr></tbody></table>
       </div>
    );
  }
}


function renderRoot() {
  var domContainerNode = window.document.getElementById('root');
//  ReactDOM.unmountComponentAtNode(domContainerNode);
  ReactDOM.render(<App />, domContainerNode);
}

$(document).ready (function() {
  renderRoot();
});


