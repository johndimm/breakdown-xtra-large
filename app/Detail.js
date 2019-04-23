class Detail extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      header: [],
      body: [],
      limit: 30
    };
  }

  componentDidMount() {
    this.getData(this.props);
  }

  componentWillReceiveProps(newProps) {
    this.getData(newProps);
  }

  getData(newProps) {
    //
    // Run detail query to get data for this report.
    //
    var data = new FormData();
    data.append('proc', 'detail');
    data.append('whereClause', newProps.whereClause);
    data.append('format', 'csv');
    data.append('limit', ' limit ' + this.state.limit);
    data.append('source', this.props.source);

    fetch("mysql.php", {
      method: "POST",
      body: data
    }).then(function (response) {
      return response.ok ? response.text() : Promise.reject(response.status);
    }.bind(this)).then(function (result) {
      console.log(result);

      var lines = result.split("\n");

      var header = lines[0].split("\t");
      lines.splice(0, 1);
      this.setState({ header: header, body: lines });
    }.bind(this));
  }

  downloadAll() {
    this.setState({ limit: this.state.limit + 100 });

    setTimeout(function () {
      this.getData(this.props);
    }.bind(this), 0);
  }

  render() {
    var header = this.state.header.map(function (key, i) {
      return React.createElement(
        'th',
        { key: i },
        key
      );
    });

    var rows = this.state.body.map(function (key, i) {
      var cols = key.split("\t");
      var columns = cols.map(function (key2, i2) {
        var value = key2;
        if (this.state.header[i2] == 'poster_path') {
          var src = 'https://image.tmdb.org/t/p/w200/' + value;

          value = React.createElement('img', { width: '100', src: src });
        }
        return React.createElement(
          'td',
          { key: i2 },
          value
        );
      }.bind(this));

      return React.createElement(
        'tr',
        { key: i },
        columns
      );
    }.bind(this));

    return React.createElement(
      'div',
      { id: 'detail_div' },
      React.createElement(
        'table',
        null,
        React.createElement(
          'tbody',
          null,
          React.createElement(
            'tr',
            null,
            header
          ),
          rows
        )
      ),
      React.createElement(
        'div',
        { className: 'download_link' },
        React.createElement(
          'button',
          { className: 'download_button', onClick: this.downloadAll.bind(this) },
          '+100'
        )
      )
    );
  }
}