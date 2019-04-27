class Detail extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      header: [],
      body: [],
      limit: 30,
      orderBy: '',
      sortDir: 'DESC'
    };
  }

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(newProps) {
    this.getData(newProps, this.saveData.bind(this));
  }

  saveData(result) {
    // console.log(result);
    var lines = result.split("\n");
    var header = lines[0].split("\t");
    lines.splice(0, 1);
    this.setState({
      header: header,
      body: lines
    });
  }

  downloadData(result) {
    var lines = result.split("\n");
    var header = lines[0].split("\t");
    lines.splice(0, 1);
    var filename = 'breakdown_' + this.props.source + '_' + this.props.whereClause + '.csv';
    var header = '';
    this.state.header.forEach(function (key, i) {
      header += key + "\t";
    });
    var linesOut = lines.map(function (key, i) {
      return key + "\n";
    });
    var csv = 'data:text/csv;charset=utf-8,' + header + "\n" + linesOut;
    var data = encodeURI(csv);
    var link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
  }

  getData(newProps, fnSuccess) {
    //
    // Run detail query to get data for this report.
    //
    var data = new FormData();
    data.append('proc', 'detail');
    data.append('whereClause', newProps.whereClause);
    data.append('format', 'csv');
    data.append('limit', ' limit ' + this.state.limit);
    data.append('source', this.props.source);
    var orderBy = this.state.orderBy;
    if (orderBy != '') orderBy += ' ' + this.state.sortDir;
    data.append('orderBy', orderBy);
    fetch("mysql.php", {
      method: "POST",
      body: data
    }).then(function (response) {
      return response.ok ? response.text() : Promise.reject(response.status);
    }.bind(this)).then(function (result) {
      fnSuccess(result);
    }.bind(this));
  }

  showNextChunk() {
    this.setState({
      limit: this.state.limit + 100
    }, function () {
      this.getData(this.props);
    }.bind(this));
  }

  downloadCSV() {
    this.getData(this.props, this.downloadData.bind(this));
  }

  sortBy(column) {
    //
    // Set sort field and direction of sort.
    //
    var sameColumn = column == this.state.orderBy;
    var newDir = sameColumn && this.state.sortDir == 'DESC' ? 'ASC' : 'DESC';
    this.setState({
      orderBy: column,
      sortDir: newDir
    }, function () {
      this.componentWillReceiveProps(this.props);
    }.bind(this));
  }

  render() {
    const upArrow = "\u25B4";
    const downArrow = "\u25Be";
    var header = this.state.header.map(function (key, i) {
      var arrow = '';

      if (this.state.orderBy == key) {
        arrow = this.state.sortDir == 'ASC' ? upArrow : downArrow;
      }

      return React.createElement("th", {
        className: "detail_heading",
        onClick: function () {
          this.sortBy(key);
        }.bind(this),
        key: i
      }, key, " ", arrow);
    }.bind(this));
    var rows = this.state.body.map(function (key, i) {
      var cols = key.split("\t");
      var columns = cols.map(function (key2, i2) {
        var value = key2;

        if (this.state.header[i2] == 'poster_path') {
          var src = 'https://image.tmdb.org/t/p/w200/' + value;
          value = React.createElement("img", {
            width: "100",
            src: src
          });
        }

        return React.createElement("td", {
          key: i2
        }, value);
      }.bind(this));
      return React.createElement("tr", {
        key: i
      }, columns);
    }.bind(this));
    return React.createElement("div", {
      id: "detail_div"
    }, React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, header), rows)), React.createElement("div", {
      className: "download_link"
    }, React.createElement("button", {
      className: "download_button",
      onClick: this.showNextChunk.bind(this)
    }, "+100"), "|", React.createElement("button", {
      className: "download_button",
      onClick: this.downloadCSV.bind(this)
    }, "Download")));
  }

}