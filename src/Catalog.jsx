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
    lovefield.init();
    var result = lovefield.getBreakdownSources();
    if (result != null && result.length > 0) {
        for (var i=0; i<result.length; i++) {
            var r = JSON.parse(result[i]);

            r.database = 'lovefield';
            this.registerSource(r);
            this.setState({importedOwnData: true});
        }
    }
  }

  registerSource(r) {
    // Fix measures to work as params.
    r.m_array = r.measures.split(",");
    r.d_array = r.dimensions.split(",");
    r.d_array = r.d_array.map(function(key, i) {
      return "'" + r.d_array[i].trim() + "'";
    });

    var source_set = this.state.source_set;
    source_set[r.name] = r;
    this.setState({source_set: source_set});
  }


  getDimMetadata(source_set_name, dim_metadata_table) {
    var data = new FormData();
    data.append ('proc','get_dim_metadata');
    data.append('param', dim_metadata_table);

    fetch("mysql.php",{
      method: "POST",
      body: data
    })
      .then(function (response) {
          return response.json();
    }).then(function (result) {

      var dim_metadata = {};

      result.forEach(function(key, i) {
          dim_metadata[key.name] = key.metadata;
      });
      this.state.source_set[source_set_name].dim_metadata = dim_metadata;

      // Set source here for one with metadata.
//      this.setSource(source_set_name);

    }.bind(this)
    );

  }

  setSourceName(key) {
    var source = this.state.source_set[key];
    if (! isEmptyObject(source)) {
      this.setState({source:source, datasetName: key});
//      if (source.database == 'lovefield')
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

          if (database != requestedDatabase)
            return null;

          var img = '';
          var grayed_out = '';
          var className = "dataset_cell";
          var titleText = '';
          if (displayOption == 'image') {
            img = (  <img src={key + '.jpg'} width="200" />);
          } else {
            img = (<span></span>);
          }

          var google_sheet = google_sheet != null &&  google_sheet != '' && displayOption != 'image'
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
                    //    this.toggleDatasetsDisplay();

                    this.setSourceName(key);

                    //
                    // XXX if the db is not yet open, open it, and open this source when it's ready.
                    //
                    if (database == 'lovefield' && lovefield.db == null) {
                        lovefield.connect(null, null, this.onConnect.bind(this));
                    } else {
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

    closeDatabase() {
      location.reload();
    }

  importInstructions() {

    return (
      <div id="import_instructions">
               Breakdown works with public data from cloud or private data on your own
               computer.  <b>Your data stays on your computer.</b>  This program imports it
               into a small database system that runs on your computer and all analysis is done locally.
               The local javascript database is <a
               href='https://google.github.io/lovefield/'>Lovefield</a> by Google.

               <h3>import your csv file into your local Lovefield database</h3>

               <div id="import_button">
               <input type="file" name="files[]" id="fileUpload" onChange={this.handleFileUpload.bind(this)}/>
               </div>
               <br />
               <i>Note: your file never leaves your computer</i>

               <h3> Instructions</h3>
               <ol>
                   <li>get a csv file
                     <ul>
                     <li>the best candidates have text columns (dimensions) and number columns (measures)
                     and could be used to make a pivot table.
                     </li>
                     <li>To test the system, click on any of the Google Sheets links in the
                     online demo list and download the csv file for the underlying data.
                     </li>
                     <li>Lovefield uses IndexedDB which currently
                     has a limit of 50 Meg.
                     </li>
                     </ul>
                   </li>

                   <li>click the "choose file" button above and import your csv file.
                   </li>


                   <li> enjoy the refreshing feeling of surfing effortlessly through joint distributions of your data.
                   </li>
               </ol>


       </div>
    );

  }

  render() {
      if (this.state.importedOwnData) {
        return this.renderPowerUser();
      } else {
        return this.renderNewUser();
      }
   }

   renderPowerUser() {

      var onlineDatasets =
      Object.keys(this.state.source_set).map(function(key, i) {
            return this.printDatasetLink('mysql', key, i, "name");
        }.bind(this));

      var localDatasets =
      Object.keys(this.state.source_set).map(function(key, i) {
            return this.printDatasetLink('lovefield', key, i, "fields");
        }.bind(this));

      var importInstructions = this.importInstructions();

      return (
      <div>
          <div id='dataset_title' onClick={
          function() {
            this.toggleDatasetsDisplay();
          }.bind(this)
          }>Datasets</div>

          <div id='datasets'>


               <div id="catalog_title">Breakdown</div>

               <table><tbody><tr>
               {onlineDatasets}
               </tr></tbody></table>

          <h2>My Own Private Data</h2>

               <table><tbody><tr>
               {localDatasets}
               </tr></tbody></table>

           {importInstructions}


          </div>

          <App source={this.state.source}/>
      </div>
      );
   }

   displayImportInstructions() {
      this.setState({displayImportInstructions: true});
   }

   renderNewUser() {
      var onlineDatasets =
      Object.keys(this.state.source_set).map(function(key, i) {
            return this.printDatasetLink('mysql', key, i, "image");
        }.bind(this));

    var importInstructions = this.state.displayImportInstructions
      ? this.importInstructions()
      : null;

    return (
      <div>
          <div id='dataset_title' onClick={
          function() {
            this.toggleDatasetsDisplay();
          }.bind(this)
          }>Datasets</div>

          <div id='datasets'>


               <div id="catalog_title">Breakdown</div>

               Breakdown is a visualization tool for data organized as dimensions and measures.  Here are some examples.


               <table><tbody><tr>
               {onlineDatasets}
               </tr></tbody></table>

               <div id="try_it" onClick={this.displayImportInstructions.bind(this)}><i>Try it on your own data</i></div>
               {importInstructions}

          </div>

          <App source={this.state.source}/>
      </div>
    )
  }

}