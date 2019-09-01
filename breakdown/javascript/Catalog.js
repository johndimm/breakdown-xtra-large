var Database = {};

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
      id: "import_button",
      className: "upload-btn-wrapper"
    }, React.createElement("button", {
      className: "btn"
    }, "Import"), React.createElement("input", {
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
    this.reader.onload = this.handleFileRead.bind(this); // this.dataset_set = {};

    this.state = {
      dataset: {},
      dataset_set: {},
      datasetName: '',
      importedOwnData: false,
      displayImportInstructions: false
    };
  }

  componentDidMount() {
    //
    // Get Lovefield datasets.
    //
    var lastSource = this.getLovefieldSources();
    var requestedSource = getRequestedSource();

    if (requestedSource == '' && lastSource != '') {
      // We're NOT supposed to open the newly downloaded Mint transaction file.
      // So we can open the existing Lovefield database if there is one.
      Database = lovefield;
      lovefield.datasets.init();
      lovefield.connect(null, null, function () {
        this.getLovefieldSources();
        this.toggleDatasetsDisplay();
        this.setSourceName(lastSource);
      }.bind(this));
    } //
    // Get mysql datasets.
    //


    mysql.getBreakdownSources(function (result) {
      for (var i = 0; i < result.length; i++) {
        var r = result[i];
        r.database = 'mysql';
        this.registerSource(r);
      }

      var requestedSource = getRequestedSource();

      if (requestedSource == '' && lastSource == '') {
        //
        // If there's no request, and no Lovefield dataset, use the Olympics on the server.
        //
        Database = mysql;
        this.toggleDatasetsDisplay();
        this.setSourceName(r.name);
      }
    }.bind(this));
  }

  getLovefieldSources() {
    //
    // Get lovefield datasets, from localStorage (fast).
    //
    lovefield.datasets.init();
    var lastSource = '';
    var result = lovefield.getBreakdownSources();

    if (result != null && result.length > 0) {
      for (var i = 0; i < result.length; i++) {
        var r = result[i];
        r.database = 'lovefield';
        this.registerSource(r);
        this.setState({
          importedOwnData: true
        });
        lastSource = r.name;
      }
    }

    return lastSource;
  }

  registerSource(r) {
    //
    // Convert dimensions and measures from comma-separated strings to arrays.
    //
    if (!Array.isArray(r.dimensions)) {
      r.dimensions = r.dimensions.split(",");
      r.measures = r.measures.split(",");
    }

    var dataset_set = this.state.dataset_set;
    dataset_set[r.name] = r;
    this.setState({
      dataset_set: dataset_set
    });
  }

  setSourceName(key) {
    var dataset = this.state.dataset_set[key];

    if (!isEmptyObject(dataset)) {
      this.setState({
        dataset: dataset,
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
    var dataset = this.state.dataset_set[key];
    var page_title = dataset.page_title;
    var database = dataset.database;
    var google_sheet = dataset.google_sheet;
    if (database != requestedDatabase) return null;
    var img = '';
    var description = '';

    if (displayOption == 'full') {
      img = React.createElement("img", {
        src: key + '.jpg',
        width: "200"
      });
      description = dataset.description;
    }

    var grayed_out = '';
    var className = "dataset_cell";
    var titleText = '';
    var google_sheet = google_sheet != null && google_sheet != '' ? React.createElement("div", null, React.createElement("a", {
      target: "_blank",
      href: google_sheet
    }, "google sheet")) : '';
    var url = dataset.url;
    var fields = null;

    if (dataset.database == 'lovefield') {
      fields = dataset.fields.split(",").map(function (field, i) {
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
        // If the db is not yet open, open it now, and open this dataset when it's ready.
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
      className: "dataset_title"
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
    var datasetName = name.substring(0, name.indexOf('.')); // MMMM special handling for Mint.

    datasetName = 'MintTransactions'; //        lovefield.addSource(datasetName, content, this.getLovefieldSources.bind(this));

    lovefield.addSource(datasetName, content, function () {
      //lovefield.init();
      this.getLovefieldSources();
      this.toggleDatasetsDisplay();
      this.setSourceName(datasetName); //this.registerSource(lovefield.datasets.ds[datasetName]);
      //this.toggleDatasetsDisplay();
      //this.setSourceName(datasetName);
    }.bind(this));
  }

  turnOnDisplayImportInstructions() {
    this.setState({
      displayImportInstructions: true
    });
  }

  render() {
    var ds = React.createElement("div", {
      className: "preloader10"
    }, React.createElement("span", null), React.createElement("span", null));
    if (this.state.dataset.database != null) ds = React.createElement("div", null);

    if (urlparam('dataset', '') != '') {
      ds = React.createElement("div", {
        id: "datasets",
        className: "upload-btn-wrapper"
      }, React.createElement("div", {
        id: "catalog_title"
      }, "Breakdown for Mint"), React.createElement("div", {
        id: "datasets_intro"
      }, React.createElement("i", null, "Import the transactions.csv file you just downloaded from Mint")), React.createElement("label", {
        className: "btn"
      }, React.createElement("input", {
        type: "file",
        name: "files[]",
        id: "fileUpload",
        onChange: this.handleFileUpload.bind(this)
      }), "Import"), React.createElement("div", {
        id: "datasets_diagram"
      }, React.createElement("img", {
        src: "images/lovefield.png"
      })), React.createElement("div", null, React.createElement("a", {
        href: window.location.href.replace(window.location.search, '')
      }, "Skip the file load, use my existing data.")));
    }

    return React.createElement("div", null, ds, React.createElement(Breakdown, {
      dataset: this.state.dataset
    }));
  }

  render_v0() {
    var onlineDatasets = Object.keys(this.state.dataset_set).map(function (key, i) {
      return this.printDatasetLink('mysql', key, i, !this.state.importedOwnData ? "full" : "compact");
    }.bind(this));
    var localDatasets = [];
    Object.keys(this.state.dataset_set).forEach(function (key, i) {
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
      dataset: this.state.dataset
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