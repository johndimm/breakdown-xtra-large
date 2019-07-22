class Catalog extends React.Component {
  constructor(props, context) {
    super(props, context); // Setup file reading

    this.reader = new FileReader();
    this.reader.onload = this.handleFileRead.bind(this); // this.source_set = {};

    this.state = {
      source: {},
      source_set: {},
      importedOwnData: false,
      displayImportInstructions: false
    };
  }

  componentDidMount() {
    //
    // Get mysql sources.
    //
    mysql.getBreakdownSources(function (result) {
      for (var i = 0; i < result.length; i++) {
        var r = result[i];
        r.database = 'mysql';
        this.registerSource(r);
        if (r.dim_metadata_table != '') this.getDimMetadata(r.name, r.dim_metadata_table);
      }
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
        this.setState({
          importedOwnData: true
        });
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

  onConnect() {
    this.toggleDatasetsDisplay();
    this.getLovefieldSources();
  }

  printDatasetLink(requestedDatabase, key, i, displayOption) {
    var source = this.state.source_set[key];
    var page_title = source.page_title;
    var description = displayOption == 'image' ? source.description : '';
    var database = source.database;
    var google_sheet = source.google_sheet;
    if (database != requestedDatabase) return null;
    var img = '';
    var grayed_out = '';
    var className = "dataset_cell";
    var titleText = '';

    if (displayOption == 'image') {
      img = React.createElement("img", {
        src: key + '.jpg',
        width: "200"
      });
    } else {
      img = React.createElement("span", null);
    }

    var google_sheet = google_sheet != null && google_sheet != '' && displayOption != 'image' ? React.createElement("div", null, React.createElement("a", {
      target: "_blank",
      href: google_sheet
    }, "google sheet")) : '';
    var url = source.url;
    var fields = null;

    if (source.database == 'lovefield') {
      fields = source.fields.split(",").map(function (field, i) {
        return React.createElement("li", {
          key: i
        }, field);
      });
    }

    return React.createElement("td", {
      key: i,
      className: className,
      title: titleText,
      onClick: function () {
        //    this.toggleDatasetsDisplay();
        this.setSourceName(key); //
        // XXX if the db is not yet open, open it, and open this source when it's ready.
        //

        if (database == 'lovefield' && lovefield.db == null) {
          lovefield.connect(null, null, this.onConnect.bind(this));
        } else {
          this.toggleDatasetsDisplay();
        }
      }.bind(this)
    }, React.createElement("div", {
      className: "source_title"
    }, page_title), img, React.createElement("div", null, React.createElement("i", null, description)), google_sheet, React.createElement("ul", null, fields));
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

  importInstructions() {
    return React.createElement("div", {
      id: "import_instructions"
    }, "Breakdown works with public data from cloud or private data on your own computer.  ", React.createElement("b", null, "Your data stays on your computer."), "  This program imports it into a small database system that runs on your computer. and uses SQL to slice and dice.  The local javascript database is ", React.createElement("a", {
      href: "https://google.github.io/lovefield/"
    }, "Lovefield"), " by Google.", React.createElement("h3", null, "import your csv file into your local Lovefield database"), React.createElement("div", {
      id: "import_button"
    }, React.createElement("input", {
      type: "file",
      name: "files[]",
      id: "fileUpload",
      onChange: this.handleFileUpload.bind(this)
    })), React.createElement("br", null), React.createElement("i", null, "Note: your file never leaves your computer"), React.createElement("h3", null, " Instructions"), React.createElement("ol", null, React.createElement("li", null, "get a csv file", React.createElement("ul", null, React.createElement("li", null, "the best candidates have text columns (dimensions) and number columns (measures) and could be used to make a pivot table."), React.createElement("li", null, "To test the system, click on any of the Google Sheets links in the online demo list and download the csv file for the underlying data."), React.createElement("li", null, "Lovefield uses IndexedDB which currently has a limit of 50 Meg."))), React.createElement("li", null, "click the \"choose file\" button above and import your csv file."), React.createElement("li", null, " enjoy the refreshing feeling of surfing effortlessly through joint distributions of your data.")));
  }

  render() {
    if (this.state.importedOwnData) {
      return this.renderPowerUser();
    } else {
      return this.renderNewUser();
    }
  }

  renderPowerUser() {
    var onlineDatasets = Object.keys(this.state.source_set).map(function (key, i) {
      return this.printDatasetLink('mysql', key, i, "name");
    }.bind(this));
    var localDatasets = Object.keys(this.state.source_set).map(function (key, i) {
      return this.printDatasetLink('lovefield', key, i, "fields");
    }.bind(this));
    var importInstructions = this.importInstructions();
    return React.createElement("div", null, React.createElement("div", {
      id: "dataset_title",
      onClick: function () {
        this.toggleDatasetsDisplay();
      }.bind(this)
    }, "Datasets"), React.createElement("div", {
      id: "datasets"
    }, React.createElement("div", {
      id: "catalog_title"
    }, "Breakdown"), React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, onlineDatasets))), React.createElement("h2", null, "My Own Private Data"), React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, localDatasets))), importInstructions), React.createElement(App, {
      source: this.state.source
    }));
  }

  displayImportInstructions() {
    this.setState({
      displayImportInstructions: true
    });
  }

  renderNewUser() {
    var onlineDatasets = Object.keys(this.state.source_set).map(function (key, i) {
      return this.printDatasetLink('mysql', key, i, "image");
    }.bind(this));
    var importInstructions = this.state.displayImportInstructions ? this.importInstructions() : null;
    return React.createElement("div", null, React.createElement("div", {
      id: "dataset_title",
      onClick: function () {
        this.toggleDatasetsDisplay();
      }.bind(this)
    }, "Datasets"), React.createElement("div", {
      id: "datasets"
    }, React.createElement("div", {
      id: "catalog_title"
    }, "Breakdown"), "Breakdown is a visualization tool for data organized as dimensions and measures.  Here are some examples.", React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, onlineDatasets))), React.createElement("div", {
      id: "try_it",
      onClick: this.displayImportInstructions.bind(this)
    }, React.createElement("i", null, "Try it on your own data")), importInstructions), React.createElement(App, {
      source: this.state.source
    }));
  }

}