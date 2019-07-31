/*
 * Copyright 2019 John Dimm -- All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license.
 */

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

  saveData(lines) {
      // console.log(result);

      // var lines = result.split("\n");
      var header = lines[0].split("\t");
      lines.splice(0,1);

      this.setState({header: header, body: lines});
  }

  // downloadData(result) {
  //  var lines = result.split("\n");
  downloadData(lines) {
    var header = lines[0].split("\t");
    lines.splice(0,1);

    var filename = 'breakdown_' + this.props.dataset + '_' + this.props.whereClause + '.csv';

    var header = '';
    this.state.header.forEach(function(key, i) { header += key + "\t"});
    var linesOut = lines.map(function(key, i) { return key + "\n"; });

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

    var params = {
      whereClause : newProps.whereClause,
      limit: this.state.limit,
      dataset: this.props.dataset,
      orderBy: this.state.orderBy,
      sortDir: this.state.sortDir
    };
    Database.getDetail(params, fnSuccess);
  }

  showNextChunk() {
     this.setState({limit: this.state.limit + 100},
       function() {this.getData(this.props);}.bind(this));
  }

  downloadCSV() {
    this.setState({limit: 100000000}, function() {
      this.getData(this.props, this.downloadData.bind(this));
    }.bind(this));
  }
  
  sortBy(column) {
       //
       // Set sort field and direction of sort.
       //
       var sameColumn = column == this.state.orderBy;
       var newDir = (sameColumn && this.state.sortDir == 'DESC') ? 'ASC' : 'DESC';
       this.setState({orderBy: column, sortDir: newDir},
          function() {this.componentWillReceiveProps(this.props)}.bind(this));
  }

  render() {

    const upArrow = "\u25B4";
    const downArrow = "\u25Be";

    var header = this.state.header.map(function(key, i) {

      var arrow = '';
      if (this.state.orderBy == key) {
        arrow = this.state.sortDir == 'ASC' ? upArrow : downArrow;
      }

      return (
        <th className="detail_heading" onClick={function() {this.sortBy(key)}.bind(this)} key={i}>{key} {arrow}</th>
      )
    }.bind(this))

    var rows = this.state.body.map(function(key, i) {
      var cols = key.split("\t");
      var columns = cols.map(function(key2, i2) {
        var value = key2;
        if (this.state.header[i2] == 'poster_path') {
          var src = 'https://image.tmdb.org/t/p/w200/' + value;

          value = (
            <img width="100" src={src} />
            );
        }
        return (
          <td key={i2}>{value}</td>
        )
      }.bind(this));

      return (
        <tr key={i}>
          {columns}
        </tr>
      )
    }.bind(this));



    return (
      <div id="detail_div">
      <table>
        <tbody>
          <tr>{header}</tr>
          {rows}
        </tbody>
      </table>

        <div className="download_link" >
          <button className="download_button" onClick={this.showNextChunk.bind(this)}>+100</button>
          &nbsp;
          <button className="download_button" onClick={this.downloadCSV.bind(this)}>Download</button>
        </div>



      </div>
    );
  }
}
