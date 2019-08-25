var Database = {};

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

        <div id="import_button" className="upload-btn-wrapper">
        <button className='btn'>Import</button>
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

    // this.dataset_set = {};
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

        lovefield.connect(null, null, function() {
           this.getLovefieldSources();
           this.toggleDatasetsDisplay();
           this.setSourceName(lastSource);
         }.bind(this));
     }

    //
    // Get mysql datasets.
    //
      mysql.getBreakdownSources(function(result) {
          for (var i=0; i<result.length; i++) {
            var r = result[i];

            r.database = 'mysql';
            this.registerSource(r);
          }

          var requestedSource = getRequestedSource();
          if (requestedSource == '' && lastSource == '')  {
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
        for (var i=0; i<result.length; i++) {
            var r = result[i];

            r.database = 'lovefield';
            this.registerSource(r);
            this.setState({importedOwnData: true});
            lastSource = r.name;
        }
    }

    return lastSource;
  }

  registerSource(r) {
    //
    // Convert dimensions and measures from comma-separated strings to arrays.
    //
    if (! Array.isArray(r.dimensions)) {
      r.dimensions = r.dimensions.split(",");
      r.measures = r.measures.split(",");
    }

    var dataset_set = this.state.dataset_set;
    dataset_set[r.name] = r;
    this.setState({dataset_set: dataset_set});
  }

  setSourceName(key) {
    var dataset = this.state.dataset_set[key];
    if (! isEmptyObject(dataset)) {
      this.setState({dataset:dataset, datasetName: key});
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

      if (database != requestedDatabase)
        return null;

      var img = '';
      var description = '';
      if (displayOption == 'full') {
        img = (  <img src={key + '.jpg'} width="200" />);
        description = dataset.description;
      }

      var grayed_out = '';
      var className = "dataset_cell";
      var titleText = '';

      var google_sheet = google_sheet != null &&  google_sheet != ''
         ? (<div><a  target="_blank" href={google_sheet}>google sheet</a></div>)
         : ''
         ;

      var url = dataset.url;

      var fields = null;
      if (dataset.database == 'lovefield') {
          fields = dataset.fields.split(",").map(function(field, i) {
          return (<li key={i}>{field}</li>)
        });
      }

      return (
        <td key={i} className={className} title={titleText}
              onClick={function() {
                //
                // If the db is not yet open, open it now, and open this dataset when it's ready.
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

            <div  className='dataset_title'>
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
        var datasetName = name.substring(0, name.indexOf('.'));

        // MMMM special handling for Mint.
        datasetName = 'MintTransactions';

//        lovefield.addSource(datasetName, content, this.getLovefieldSources.bind(this));
        lovefield.addSource(datasetName, content,  function() {
          //lovefield.init();
          this.getLovefieldSources();
          this.toggleDatasetsDisplay();
          this.setSourceName(datasetName);


          //this.registerSource(lovefield.datasets.ds[datasetName]);
          //this.toggleDatasetsDisplay();
          //this.setSourceName(datasetName);
        }.bind(this))
    }

   turnOnDisplayImportInstructions() {
      this.setState({displayImportInstructions: true});
   }

   render() {

     var ds = (<div></div>);
     if (urlparam('dataset', '') != '') {
       ds = (
        <div id="datasets" className="upload-btn-wrapper">
          <div id='catalog_title'>Breakdown for Mint</div>
          <div id="datasets_intro">
            <i>Import the transactions.csv file you just downloaded from Mint</i>
          </div>

            <label className='btn'>
               <input type="file" name="files[]" id="fileUpload" onChange={this.handleFileUpload.bind(this)}/>
               Import
             </label>

          <div id="datasets_diagram">
            <img src="images/lovefield.png" />
          </div>

          <div>
            <a href={window.location.href.replace(window.location.search, '')}>Skip the file load, use my existing data.</a>
          </div>
        </div>

       )
     }


     return (
       <div>
          {ds}

          <Breakdown dataset={this.state.dataset}/>
       </div>
     );
   }

  render_v0() {
      var onlineDatasets =
      Object.keys(this.state.dataset_set).map(function(key, i) {
            return this.printDatasetLink('mysql', key, i, ! this.state.importedOwnData ?  "full" : "compact");
        }.bind(this));

      var localDatasets = [];
      Object.keys(this.state.dataset_set).forEach(function(key, i) {
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

        <Breakdown dataset={this.state.dataset}/>
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
