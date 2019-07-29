class ImportInstructions extends React.Component {
  render() {
    if (!this.props.importedOwnData && !this.props.displayImportInstructions) {
      return this.tryIt();
    } else if (!this.props.importedOwnData && this.props.displayImportInstructions) {
      return this.importInstructions();
    } else if (this.props.importedOwnData && this.props.dbIsOpen) {
      return this.requestReload();
    } else if (this.props.importedOwnData && !this.props.dbIsOpen) {
      return this.importInstructions();
    }
  }

  requestReload() {
    return React.createElement("button", {
      id: "import_instructions_button",
      onClick: function () {
        location.reload();
      }
    }, "import another csv file");
  }

  tryIt() {
    return React.createElement("div", {
      id: "try_it",
      onClick: this.props.turnOnDisplayImportInstructions
    }, React.createElement("i", null, "Try it on your own data"));
  }

  importInstructions() {
    return React.createElement("div", {
      id: "import_instructions"
    }, "Breakdown works with public data from cloud or private data on your own computer.  ", React.createElement("b", null, "Your data stays on your computer."), "  This program imports it into a small database system that runs on your computer and all analysis is done locally. The local javascript database is ", React.createElement("a", {
      href: "https://google.github.io/lovefield/"
    }, "Lovefield"), " by Google.", React.createElement("h3", null, "Import a csv file into your local Lovefield database"), React.createElement("div", {
      id: "import_button"
    }, React.createElement("input", {
      type: "file",
      name: "files[]",
      id: "fileUpload",
      onChange: this.props.handleFileUpload
    })), React.createElement("br", null), React.createElement("i", null, "Note: your file never leaves your computer"), React.createElement("h3", null, "Instructions"), React.createElement("ol", null, React.createElement("li", null, "get a csv file.  Here's one to try before using one of your own: ", React.createElement("a", {
      href: "data/olympics_local.csv"
    }, "Olympic Medals")), React.createElement("li", null, "click the \"choose file\" button above and import the csv file.")), React.createElement("h3", null, "What sort of csv files works with breakdown?"), React.createElement("ul", null, React.createElement("li", null, "the best candidates have text columns (dimensions) and number columns (measures) , the sort of data that would make a good pivot table."), React.createElement("li", null, "for examples, click on the Google Sheets links in the online demo list and download the csv file for the underlying data."), React.createElement("li", null, "the first line determines which columns are metrics (the ones that parse as a number) and which are dimensions (everything else)."), React.createElement("li", null, "Lovefield uses IndexedDB which currently has a limit of 50 Meg.")));
  }

}

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
    lovefield.readBreakdownSources();
    var result = lovefield.getBreakdownSources();

    if (result != null && result.length > 0) {
      for (var i = 0; i < result.length; i++) {
        var r = result[i];
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
    //    r.m_array = r.measures.split(",");
    //    r.d_array = r.dimensions.split(",");
    //    r.d_array = r.d_array.map(function(key, i) {
    //      return "'" + r.d_array[i].trim() + "'";
    //    });
    var source_set = this.state.source_set; //
    // Convert dimensions and measures from comma-separated strings to arrays.
    //

    r.dimensions = r.dimensions.split(",");
    r.measures = r.measures.split(",");
    source_set[r.name] = r;
    this.setState({
      source_set: source_set
    });
  }

  setSourceName(key) {
    var source = this.state.source_set[key];

    if (!isEmptyObject(source)) {
      this.setState({
        source: source,
        datasetName: key
      });
    }
  }

  toggleDatasetsDisplay() {
    var on = $("#datasets").css('display') != 'none';
    $("#datasets").css('display', on ? 'none' : 'block');
    $("#breakdown").css('display', on ? 'block' : 'none');
  }

  printDatasetLink(requestedDatabase, key, i, displayOption) {
    var source = this.state.source_set[key];
    var page_title = source.page_title;
    var database = source.database;
    var google_sheet = source.google_sheet;
    if (database != requestedDatabase) return null;
    var img = '';
    var description = '';

    if (displayOption == 'full') {
      img = React.createElement("img", {
        src: key + '.jpg',
        width: "200"
      });
      description = source.description;
    }

    var grayed_out = '';
    var className = "dataset_cell";
    var titleText = '';
    var google_sheet = google_sheet != null && google_sheet != '' ? React.createElement("div", null, React.createElement("a", {
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
        //
        // If the db is not yet open, open it now, and open this source when it's ready.
        //
        if (database == 'lovefield' && lovefield.db == null) {
          lovefield.connect(null, null, function () {
            this.getLovefieldSources();
            this.toggleDatasetsDisplay();
            this.setSourceName(key);
          }.bind(this));
        } else {
          this.setSourceName(key);
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
    // Set progress cursor.

    $('body').addClass('waiting');
  }

  handleFileRead(event) {
    var content = event.target.result; // console.log(save); // {hp: 32, maxHp: 50, mp: 11, maxMp: 23}
    // window.localStorage.setItem('save.json', data);
    // var data = $.csv.toObjects(content);

    var name = this.filename.name;
    var sourceName = name.substring(0, name.indexOf('.'));
    lovefield.addSource(sourceName, content, this.getLovefieldSources.bind(this));
  }

  turnOnDisplayImportInstructions() {
    this.setState({
      displayImportInstructions: true
    });
  }

  render() {
    var onlineDatasets = Object.keys(this.state.source_set).map(function (key, i) {
      return this.printDatasetLink('mysql', key, i, !this.state.importedOwnData ? "full" : "compact");
    }.bind(this));
    var localDatasets = [];
    Object.keys(this.state.source_set).forEach(function (key, i) {
      var link = this.printDatasetLink('lovefield', key, i, "compact");
      if (link != null) localDatasets.push(link);
    }.bind(this));
    var privateDataStyle = {
      'display': localDatasets.length > 0 ? 'block' : 'none'
    };
    return React.createElement("div", null, React.createElement("div", {
      id: "dataset_catalog_context_switch",
      onClick: function () {
        this.toggleDatasetsDisplay();
      }.bind(this)
    }, "Datasets"), React.createElement("div", {
      id: "datasets"
    }, React.createElement("div", {
      id: "catalog_title"
    }, "Breakdown"), React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, onlineDatasets))), React.createElement("h2", {
      style: privateDataStyle
    }, "My Own Private Data"), React.createElement("table", null, React.createElement("tbody", null, React.createElement("tr", null, localDatasets))), React.createElement(ImportInstructions, {
      importedOwnData: this.state.importedOwnData,
      dbIsOpen: lovefield.db != null,
      displayImportInstructions: this.state.displayImportInstructions,
      turnOnDisplayImportInstructions: this.turnOnDisplayImportInstructions.bind(this),
      handleFileUpload: this.handleFileUpload.bind(this)
    })), React.createElement(Breakdown, {
      source: this.state.source
    }));
  }

}

function renderRoot() {
  var domContainerNode = window.document.getElementById('root'); //  ReactDOM.unmountComponentAtNode(domContainerNode);

  ReactDOM.render(React.createElement(Catalog, null), domContainerNode);
}

$(document).ready(function () {
  lovefield = new Lovefield();
  lovefield.init();
  mysql = new Mysql();
  mysql.init();
  Database = mysql; // renderRoot();
});