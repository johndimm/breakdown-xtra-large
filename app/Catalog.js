class Catalog extends React.Component {
  constructor(props, context) {
    super(props, context); // Setup file reading

    this.reader = new FileReader();
    this.reader.onload = this.handleFileRead.bind(this); // this.source_set = {};

    this.state = {
      source: {},
      source_set: {}
    };
  }

  componentDidMount() {
    //
    // Get mysql sources.
    //
    mysql.getBreakdownSources(function (result) {
      // Remember the name of one of them.
      var name = '';

      for (var i = 0; i < result.length; i++) {
        var r = result[i];
        r.database = 'mysql';
        this.registerSource(r);
        if (r.dim_metadata_table != '') this.getDimMetadata(r.name, r.dim_metadata_table);else name = r.name;
      } // Set source to the last one.


      this.setSourceName(name);
    }.bind(this));
    this.getLovefieldSources();
  }

  getLovefieldSources() {
    //
    // Get lovefield sources, from localStorage (fast).
    //
    lovefield.init();
    var result = lovefield.getBreakdownSources();

    if (result != null && result.length > 0) {
      for (var i = 0; i < result.length; i++) {
        var r = JSON.parse(result[i]);
        r.database = 'lovefield';
        this.registerSource(r);
      }
    }
  }

  registerSource(r) {
    // Fix measures to work as params.
    r.m_array = r.measures.split(",");
    r.d_array = r.dimensions.split(",");
    r.d_array = r.d_array.map(function (key, i) {
      return "'" + r.d_array[i].trim() + "'";
    });
    var source_set = this.state.source_set;
    source_set[r.name] = r;
    this.setState({
      source_set: source_set
    });
  }

  getDimMetadata(source_set_name, dim_metadata_table) {
    var data = new FormData();
    data.append('proc', 'get_dim_metadata');
    data.append('param', dim_metadata_table);
    fetch("mysql.php", {
      method: "POST",
      body: data
    }).then(function (response) {
      return response.json();
    }).then(function (result) {
      var dim_metadata = {};
      result.forEach(function (key, i) {
        dim_metadata[key.name] = key.metadata;
      });
      this.state.source_set[source_set_name].dim_metadata = dim_metadata; // Set source here for one with metadata.
      //      this.setSource(source_set_name);
    }.bind(this));
  }

  setSourceName(key) {
    var source = this.state.source_set[key];

    if (!isEmptyObject(source)) {
      this.setState({
        source: source,
        datasetName: key
      }); //      if (source.database == 'lovefield')
      //        lovefield.setSource(source.fact_table, null, source.dimensions);
    }
  }

  toggleDatasetsDisplay() {
    var on = $("#datasets").css('display') != 'none';
    $("#datasets").css('display', on ? 'none' : 'block');
    $("#breakdown").css('display', on ? 'block' : 'none');
  }

  printDatasetLink(requestedDatabase, key, i) {
    var page_title = this.state.source_set[key].page_title;
    var description = this.state.source_set[key].description;
    var database = this.state.source_set[key].database;
    var google_sheet = this.state.source_set[key].google_sheet;
    if (database != requestedDatabase) return null;
    var img = '';
    var grayed_out = '';
    var className = "dataset_cell";
    var titleText = '';

    if (requestedDatabase == 'mysql') {
      img = React.createElement("img", {
        src: key + '.jpg',
        width: "200"
      });
    } else {
      img = React.createElement("span", null);
      className += ", grayed_out";
      titleText = 'To enable, click Start Your Local Database';
      if (lovefield.db == null) $("#connect_button").css('display', 'block');
    }

    var google_sheet = google_sheet == null || google_sheet == '' ? '' : React.createElement("a", {
      target: "_blank",
      href: google_sheet
    }, "google sheet");
    var url = this.state.source_set[key].url;
    return React.createElement("td", {
      key: i,
      className: className,
      title: titleText,
      onClick: function () {
        this.toggleDatasetsDisplay();
        this.setSourceName(key);
      }.bind(this)
    }, React.createElement("div", {
      className: "source_title"
    }, page_title), img, React.createElement("br", null), React.createElement("i", null, description), React.createElement("div", null, google_sheet));
  }

  handleFileUpload(event) {
    this.filename = event.target.files[0];
    this.reader.readAsText(this.filename); // fires onload when done.
  }

  handleFileRead(event) {
    var content = event.target.result; // console.log(save); // {hp: 32, maxHp: 50, mp: 11, maxMp: 23}
    // window.localStorage.setItem('save.json', data);
    // var data = $.csv.toObjects(content);

    var name = this.filename.name;
    var sourceName = name.substring(0, name.indexOf('.'));
    lovefield.addSource(sourceName, content, this.getLovefieldSources.bind(this));
  }

  closeDatabase() {
    location.reload();
  }

  render() {
    var onlineDatasets = Object.keys(this.state.source_set).map(function (key, i) {
      return this.printDatasetLink('mysql', key, i);
    }.bind(this));
    var localDatasets = Object.keys(this.state.source_set).map(function (key, i) {
      return this.printDatasetLink('lovefield', key, i);
    }.bind(this));
    return React.createElement("div", null, React.createElement("div", {
      id: "dataset_title",
      onClick: function () {
        this.toggleDatasetsDisplay();
      }.bind(this)
    }, "Datasets"), React.createElement("div", {
      id: "datasets"
    }, React.createElement("h2", null, "Online Public Data"), React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, onlineDatasets))), React.createElement("h2", null, "Local Private Data"), React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, localDatasets))), "Breakdown works with public data from cloud or private data on your own computer.", React.createElement("b", null, "Your data stays on your computer."), "  This program imports it into a local database and uses SQL to slice and dice.  The local javascript database is ", React.createElement("a", {
      href: "https://google.github.io/lovefield/"
    }, "Lovefield"), " by Google.", React.createElement("div", {
      id: "connect_button"
    }, React.createElement("br", null), React.createElement("button", {
      onClick: function () {
        lovefield.connect(null, null, this.getLovefieldSources.bind(this));
      }.bind(this)
    }, "Start Your Local Database")), React.createElement("div", {
      id: "import_instructions"
    }, React.createElement("h3", null, "import your csv file into your local Lovefield database:"), React.createElement("ol", null, React.createElement("li", null, "get a csv file", React.createElement("ul", null, React.createElement("li", null, "preferably one that has text columns (dimensions) and number columns (measures) and could be used to make a pivot table."), React.createElement("li", null, "To test the system, click on any of the Google Sheets links in the Online Public Data list and download the csv file for the underlying data.  Lovefield uses IndexedDB which currently has a limit of 50 Meg."))), React.createElement("li", null, "click the \"choose file\" button below."), React.createElement("li", null, "click Start Your Local Database."), React.createElement("li", null, " enjoy the refreshing feeling of surfing effortlessly through joint distributions of your data.")), React.createElement("div", {
      id: "import_button"
    }, React.createElement("input", {
      type: "file",
      name: "files[]",
      id: "fileUpload",
      onChange: this.handleFileUpload.bind(this)
    })), React.createElement("br", null), React.createElement("i", null, "Note: your file never leaves your computer")), React.createElement("div", null, React.createElement("br", null), React.createElement("button", {
      onClick: this.closeDatabase
    }, "Close Local Database"))), React.createElement(App, {
      source: this.state.source
    }));
  }

}