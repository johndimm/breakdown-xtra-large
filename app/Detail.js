class Detail extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      header: [],
      body: []
    };
  }

  componentWillReceiveProps(newProps) {
    this.getData(10, newProps);
  }

  getData(limit, newProps) {
    //
    // Run detail query to get data for this report.
    //
    var data = new FormData();
    data.append('proc', 'detail');
    data.append('whereClause', newProps.whereClause);
    data.append('format', 'csv');
    data.append('limit', ' limit ' + limit);

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
    this.getData(2000, this.props);
  }

  render() {
    if (this.state.body.length == 0) return null;

    var header = this.state.header.map(function (key, i) {
      return React.createElement(
        'th',
        { key: i },
        key
      );
    });

    var rows = this.state.body.map(function (key, i) {
      //     if (i == 0)
      //       return null;

      var cols = key.split("\t");
      var columns = cols.map(function (key2, i2) {
        var value = key2;
        if (this.state.header[i2] == 'poster_path') {
          var src = 'https://image.tmdb.org/t/p/w200/' + value;

          value = React.createElement('img', { src: src });
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
        'div',
        { className: 'download_link' },
        'Sample 10 lines',
        React.createElement(
          'button',
          { className: 'download_button', onClick: this.downloadAll.bind(this) },
          'get all'
        )
      ),
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
      )
    );
  }
}