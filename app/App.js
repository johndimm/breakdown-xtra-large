const React = window.React;
const ReactDOM = window.ReactDOM;

class Banner extends React.Component {
  render() {

    if (this.props.current_source == null) return React.createElement('div', null);

    var source = this.props.source_set[this.props.current_source];

    var cell1 = React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { className: 'title_div' },
        source.page_title
      ),
      React.createElement(
        'div',
        { className: 'subtitle_div' },
        source.description
      ),
      React.createElement(
        'div',
        { className: 'about_div' },
        'About:\xA0',
        React.createElement(
          'a',
          { target: '_blank', href: source.url },
          'datasource'
        ),
        '\xA0|\xA0',
        React.createElement(
          'a',
          { target: '_blank', href: 'https://github.com/johndimm/breakdown' },
          'code'
        )
      )
    );

    var cell2 = Object.keys(this.props.source_set).map(function (key, i) {
      var page_title = this.props.source_set[key].page_title;
      var description = this.props.source_set[key].description;
      var url = this.props.source_set[key].url;
      return React.createElement(
        'li',
        { key: i },
        React.createElement(
          'span',
          { className: 'source_li',
            onClick: function () {
              this.props.setSource(key);
            }.bind(this) },
          page_title
        )
      );
    }.bind(this));

    if (cell2.length < 2) cell2 = React.createElement('div', null);

    var button_text = this.props.show_summary ? 'Detail' : 'Summary';
    var cell3 = React.createElement(
      'button',
      { onClick: this.props.toggleSummary },
      'show ',
      button_text
    );

    return React.createElement(
      'table',
      { className: 'banner' },
      React.createElement(
        'tbody',
        null,
        React.createElement(
          'tr',
          null,
          React.createElement(
            'td',
            { className: 'title_cell' },
            cell1
          ),
          React.createElement(
            'td',
            { className: 'menu_cell' },
            React.createElement(
              'ul',
              null,
              cell2
            )
          ),
          React.createElement(
            'td',
            { className: 'toggle_cell' },
            cell3
          )
        )
      )
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
    data.append('proc', 'get_breakdown_sources');
    data.append('param', '');

    fetch("mysql.php", {
      method: "POST",
      body: data
    }).then(function (response) {
      return response.json();
    }).then(function (result) {
      var name = '';
      for (var i = 0; i < result.length; i++) {
        var r = result[i];

        // Fix measures to work as params.
        r.m_array = r.measures.split(",");
        r.d_array = r.dimensions.split(",");
        r.d_array = r.d_array.map(function (key, i) {
          return "'" + r.d_array[i].trim() + "'";
        });

        this.source_set[r.name] = r;

        name = r.name;
      }

      if (name != '') this.setSource(name);
    }.bind(this));
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

    this.setState({ source: source, current_source: name, report: report }, function () {
      this.setGroupby(this.state.source.dimensions.split(',')[0]);
      this.getDimCounts();
    }.bind(this));
  }

  setGroupby(row) {
    //
    // Set the first column of the report, the field we will group by.
    //
    var report = this.state.report;
    report.groupBy = row;
    report.show_summary = true;
    this.setState({ report: report });
  }

  whereClause() {
    //
    // Serialize the array of filters into a SQL WHERE clause.
    //
    var filter_array = [];
    Object.getOwnPropertyNames(this.state.report.filters).forEach(function (row, i) {
      filter_array.push("`" + row + "` = '" + this.state.report.filters[row].replace("'", "''") + "'");
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
    if (bStayPut == null || !bStayPut) report.groupBy = this.nextDimension(key);
    // report.show_summary = true;
    this.setState({ report: report });

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
    this.setState({ report: report });

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
    dims.map(function (key, i) {
      dims[i] = "count(distinct `" + key + "`) as `" + key + "`";
    });
    var countDistinct = dims.join(",");

    var whereClause = this.whereClause();

    var data = new FormData();
    data.append('proc', 'dim_counts');
    data.append('countDistinct', countDistinct);
    data.append('whereClause', whereClause);
    data.append('source', this.state.current_source);

    fetch("mysql.php", {
      method: "POST",
      body: data
    }).then(function (response) {
      return response.json();
    }).then(function (result) {
      var report = this.state.report;
      report.dimCounts = result[0];
      this.setState({ report: report });
    }.bind(this));
  }

  storeDimValues(key, val) {
    if (!(key in this.dimValues)) this.dimValues[key] = [];
    this.dimValues[key].push(val);
  }

  clearDimValues(key) {
    this.dimValues[key] = [];
  }

  toggleSummary() {
    var report = this.state.report;
    report.show_summary = !report.show_summary;
    this.setState({ report: report });
  }

  render() {

    //
    // Create the dimension bar on the left side of the page.
    //
    var dimensions = this.state.source.dimensions.split(',').map(function (row, i) {
      var selectedValue = this.state.report.filters[row];
      var isGroupby = row == this.state.report.groupBy;
      var count = '';
      if (this.state.report.dimCounts != null) {
        if (row in this.state.report.dimCounts && this.state.report.dimCounts[row] > 1) {
          count = this.state.report.dimCounts[row];
        }
      }
      var dimValues = [];
      if (row in this.dimValues) {
        dimValues = this.dimValues[row];
      }
      return React.createElement(Dimension, {
        key: i,
        setGroupby: function () {
          this.setGroupby(row);
        }.bind(this),
        removeFilter: function () {
          this.removeFilter(row);
        }.bind(this),
        name: row,
        isGroupby: isGroupby,
        count: count,
        dimValues: dimValues,
        selectedValue: selectedValue,
        addFilter: this.addFilter.bind(this),
        slideDim: this.slideDim.bind(this),
        lastFilter: this.filterStack[this.filterStack.length - 1],
        source: this.state.current_source
      });
    }.bind(this));

    var whereClause = this.whereClause();
    var orderBy = "2 DESC";

    var report = React.createElement(Report, { groupBy: this.state.report.groupBy,
      whereClause: whereClause,
      orderBy: orderBy,

      measures: this.state.source.measures,
      summary_table: this.state.source.summary_table,

      addFilter: this.addFilter.bind(this),
      storeDimValues: this.storeDimValues.bind(this),
      clearDimValues: this.clearDimValues.bind(this),

      source: this.state.current_source
    });

    var detail = React.createElement(Detail, { whereClause: whereClause, orderBy: orderBy, source: this.state.current_source });

    var right_side = this.state.report.show_summary ? report : detail;

    //
    // Assemble the page.
    //
    return React.createElement(
      'div',
      null,
      React.createElement(Banner, { current_source: this.state.current_source,
        source_set: this.source_set,
        setSource: this.setSource.bind(this),
        toggleSummary: this.toggleSummary.bind(this),
        show_summary: this.state.report.show_summary
      }),
      React.createElement(
        'table',
        { className: 'content' },
        React.createElement(
          'tbody',
          null,
          React.createElement(
            'tr',
            null,
            React.createElement(
              'td',
              null,
              React.createElement(
                'div',
                { className: 'dimensions_div' },
                dimensions
              )
            ),
            React.createElement(
              'td',
              null,
              right_side
            )
          )
        )
      )
    );
  }
}

function renderRoot() {
  var domContainerNode = window.document.getElementById('root');
  //  ReactDOM.unmountComponentAtNode(domContainerNode);
  ReactDOM.render(React.createElement(App, null), domContainerNode);
}

$(document).ready(function () {
  renderRoot();
});