class ImportInstructions extends React.Component {

  render() {
    if (! this.props.importedOwnData && ! this.props.displayImportInstructions) {
      return this.tryIt();
    } else if (! this.props.importedOwnData && this.props.displayImportInstructions) {
      return this.importInstructions();
    } else if (this.props.importedOwnData && this.props.dbIsOpen) {
      return this.requestReload();
    } else if (this.props.importedOwnData && ! this.props.dbIsOpen) {
      return this.importInstructions();
    }
  }

  requestReload() {
     return (
           <button id="import_instructions_button" onClick={function() {location.reload()}}>import another csv file</button>
     );
  }


  tryIt() {
    return (
      <div id="try_it" onClick={this.props.turnOnDisplayImportInstructions}><i>Try it on your own data</i></div>
    );
  }


  importInstructions() {

    return (
    <div id="import_instructions">
        Breakdown works with public data from cloud or private data on your own
        computer.  <b>Your data stays on your computer.</b>  This program imports it
        into a small database system that runs on your computer and all analysis is done locally.
        The local javascript database is <a
        href='https://google.github.io/lovefield/'>Lovefield</a> by Google.

        <h3>Import a csv file into your local Lovefield database</h3>

        <div id="import_button">
        <input type="file" name="files[]" id="fileUpload" onChange={this.props.handleFileUpload}/>
        </div>
        <br />
        <i>Note: your file never leaves your computer</i>

        <h3>Instructions</h3>
        <ol>
           <li>get a csv file.  Here's one to try before using one of your own: <a href="data/olympics_local.csv">Olympic Medals</a>
           </li>

           <li>click the "choose file" button above and import the csv file.
           </li>

        </ol>

        <h3>What sort of csv files works with breakdown?</h3>

        <ul>
            <li>the best candidates have text columns (dimensions) and number columns (measures)
            , the sort of data that would make a good pivot table.
            </li>
            <li>for examples, click on the Google Sheets links in the
            online demo list and download the csv file for the underlying data.
            </li>
            <li>
            the first line determines which columns are metrics (the ones that parse as a number)
            and which are dimensions (everything else).
            </li>
            <li>Lovefield uses IndexedDB which currently
            has a limit of 50 Meg.
            </li>
            </ul>
       </div>
    );

  }

}


class Catalog extends React.Component {

  constructor(props, context) {
    super(props, context);

    // Setup file reading
    this.reader = new FileReader();
    this.reader.onload = this.handleFileRead.bind(this);

    // this.source_set = {};
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
      mysql.getBreakdownSources(function(result) {
          for (var i=0; i<result.length; i++) {
            var r = result[i];

            r.database = 'mysql';
            this.registerSource(r);

            if (r.dim_metadata_table != '')
              this.getDimMetadata(r.name, r.dim_metadata_table)
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
        for (var i=0; i<result.length; i++) {
            var r = result[i];

            r.database = 'lovefield';
            this.registerSource(r);
            this.setState({importedOwnData: true});
        }
    }
  }

  registerSource(r) {
    //
    // Convert dimensions and measures from comma-separated strings to arrays.
    //
    r.dimensions = r.dimensions.split(",");
    r.measures = r.measures.split(",");

    var source_set = this.state.source_set;
    source_set[r.name] = r;
    this.setState({source_set: source_set});
  }

  setSourceName(key) {
    var source = this.state.source_set[key];
    if (! isEmptyObject(source)) {
      this.setState({source:source, datasetName: key});
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

      if (database != requestedDatabase)
        return null;

      var img = '';
      var description = '';
      if (displayOption == 'full') {
        img = (  <img src={key + '.jpg'} width="200" />);
        description = source.description;
      }

      var grayed_out = '';
      var className = "dataset_cell";
      var titleText = '';

      var google_sheet = google_sheet != null &&  google_sheet != ''
         ? (<div><a  target="_blank" href={google_sheet}>google sheet</a></div>)
         : ''
         ;

      var url = source.url;

      var fields = null;
      if (source.database == 'lovefield') {
          fields = source.fields.split(",").map(function(field, i) {
          return (<li key={i}>{field}</li>)
        });
      }

      return (
        <td key={i} className={className} title={titleText}
              onClick={function() {
                //
                // If the db is not yet open, open it now, and open this source when it's ready.
                //
                if (database == 'lovefield' && lovefield.db == null) {
                    lovefield.connect(null, null, function() {
                       this.getLovefieldSources();
                       this.toggleDatasetsDisplay();
                       this.setSourceName(key);
                     }.bind(this));

                } else {
                    this.setSourceName(key);
                    this.toggleDatasetsDisplay();
                }

              }.bind(this)}>

            <div  className='source_title'>
              {page_title}
            </div>

            {img}
            <div>
              <i>{description}</i>
            </div>
            {google_sheet}

            <ul>
              {fields}
            </ul>
        </td>
        )
  }


    handleFileUpload(event) {
        this.filename = event.target.files[0];
        this.reader.readAsText(this.filename); // fires onload when done.

        // Set progress cursor.
        $('body').addClass('waiting');
    }

    handleFileRead(event) {
        var content = event.target.result;

        // console.log(save); // {hp: 32, maxHp: 50, mp: 11, maxMp: 23}
        // window.localStorage.setItem('save.json', data);
        // var data = $.csv.toObjects(content);

        var name = this.filename.name;
        var sourceName = name.substring(0, name.indexOf('.'));

        lovefield.addSource(sourceName, content, this.getLovefieldSources.bind(this));
    }

   turnOnDisplayImportInstructions() {
      this.setState({displayImportInstructions: true});
   }

  render() {
      var onlineDatasets =
      Object.keys(this.state.source_set).map(function(key, i) {
            return this.printDatasetLink('mysql', key, i, ! this.state.importedOwnData ?  "full" : "compact");
        }.bind(this));

      var localDatasets = [];
      Object.keys(this.state.source_set).forEach(function(key, i) {
            var link = this.printDatasetLink('lovefield', key, i, "compact");
            if (link != null)
              localDatasets.push(link);
        }.bind(this));

      var privateDataStyle = {'display': localDatasets.length > 0
        ? 'block'
        : 'none'};

      return (
      <div>
        <div id='dataset_catalog_context_switch' onClick={
          function() {
            this.toggleDatasetsDisplay();
          }.bind(this)
        }>Datasets</div>

        <div id='datasets'>

        <div id="catalog_title">Breakdown</div>

        <table><tbody><tr>
        {onlineDatasets}
        </tr></tbody></table>

        <h2 style={privateDataStyle}>My Own Private Data</h2>

        <table><tbody><tr>
        {localDatasets}
        </tr></tbody></table>

        <ImportInstructions
         importedOwnData={this.state.importedOwnData}
         dbIsOpen={lovefield.db != null}
         displayImportInstructions={this.state.displayImportInstructions}
         turnOnDisplayImportInstructions={this.turnOnDisplayImportInstructions.bind(this)}
         handleFileUpload={this.handleFileUpload.bind(this)}/>

        </div>

        <Breakdown source={this.state.source}/>
      </div>
      );
   }

}


function renderRoot() {
  var domContainerNode = window.document.getElementById('root');
//  ReactDOM.unmountComponentAtNode(domContainerNode);
  ReactDOM.render(<Catalog />, domContainerNode);
}

$(document).ready (function() {

  lovefield = new Lovefield();
  lovefield.init();

  mysql = new Mysql();
  mysql.init();

  Database = mysql;

  // renderRoot();
});
