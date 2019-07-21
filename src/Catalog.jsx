class Catalog extends React.Component {

  constructor(props, context) {
    super(props, context);

    // Setup file reading
    this.reader = new FileReader();
    this.reader.onload = this.handleFileRead.bind(this);

    // this.source_set = {};
    this.state = {source: {}, source_set: {}};
  }

    componentDidMount() {
    //
    // Get mysql sources.
    //
      mysql.getBreakdownSources(function(result) {

          // Remember the name of one of them.
          var name = '';

          for (var i=0; i<result.length; i++) {
            var r = result[i];

            r.database = 'mysql';
            this.registerSource(r);

            if (r.dim_metadata_table != '')
              this.getDimMetadata(r.name, r.dim_metadata_table)
            else
              name = r.name
          }

          // Set source to the last one.
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
        for (var i=0; i<result.length; i++) {
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

  printDatasetLink(requestedDatabase, key, i) {

          var page_title = this.state.source_set[key].page_title;
          var description = this.state.source_set[key].description;
          var database = this.state.source_set[key].database;
          var google_sheet = this.state.source_set[key].google_sheet;

          if (database != requestedDatabase)
            return null;

          var img = '';
          var grayed_out = '';
          var className = "dataset_cell";
          var titleText = '';
          if (requestedDatabase == 'mysql') {
            img = (  <img src={key + '.jpg'} width="200" />);
          } else {
            img = (<span></span>);
            className += ", grayed_out";
            titleText = 'To enable, click Start Your Local Database';

            if (lovefield.db == null)
              $("#connect_button").css('display', 'block');

          }

          var google_sheet = google_sheet == null || google_sheet == ''
             ? ''
             : (<a  target="_blank" href={google_sheet}>google sheet</a>);

          var url = this.state.source_set[key].url;
          return (
            <td key={i} className={className} title={titleText}
                  onClick={function() {
                    this.toggleDatasetsDisplay();
                    this.setSourceName(key);
                  }.bind(this)}>

              <div  className='source_title'>
                  {page_title}
              </div>

                {img}
                <br />
                <i>{description}</i>

              <div>
                  {google_sheet}
              </div>
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

  render() {
      var onlineDatasets =
      Object.keys(this.state.source_set).map(function(key, i) {
            return this.printDatasetLink('mysql', key, i);
        }.bind(this));


      var localDatasets =
      Object.keys(this.state.source_set).map(function(key, i) {
          return this.printDatasetLink('lovefield', key, i);
      }.bind(this));


    return (
      <div>
          <div id='dataset_title' onClick={
          function() {
            this.toggleDatasetsDisplay();
          }.bind(this)
          }>Datasets</div>

          <div id='datasets'>


               <h2>Online Public Data</h2>

               <table><tbody><tr>
               {onlineDatasets}
               </tr></tbody></table>

          <h2>Local Private Data</h2>

               <table><tbody><tr>
               {localDatasets}
               </tr></tbody></table>

               Breakdown works with public data from cloud or private data on your own computer.
               <b>Your data stays on your computer.</b>  This program imports it into a local database and uses
               SQL to slice and dice.  The local javascript database is <a
               href='https://google.github.io/lovefield/'>Lovefield</a> by Google.

               <div id="connect_button">
                   <br />
                   <button onClick={function() {
                     lovefield.connect(null, null, this.getLovefieldSources.bind(this));
                   }.bind(this)}>Start Your Local Database</button>
               </div>

               <div id="import_instructions">

               <h3>import your csv file into your local Lovefield database:</h3>
               <ol>
                   <li>get a csv file
                     <ul>
                     <li>preferably one that has text columns (dimensions) and number columns (measures)
                     and could be used to make a pivot table.
                     </li>
                     <li>To test the system, click on any of the Google Sheets links in the
                     Online Public Data list and download the csv file for the underlying data.  Lovefield uses IndexedDB which currently
                     has a limit of 50 Meg.
                     </li>
                     </ul>
                   </li>

                   <li>click the "choose file" button below.
                   </li>

                   <li>click Start Your Local Database.
                   </li>

                   <li> enjoy the refreshing feeling of surfing effortlessly through joint distributions of your data.
                   </li>
               </ol>


               <div id="import_button">
                 <input type="file" name="files[]" id="fileUpload" onChange={this.handleFileUpload.bind(this)}/>
               </div>
               <br />
               <i>Note: your file never leaves your computer</i>

               </div>

               <div>
                 <br />
                 <button onClick={this.closeDatabase}>Close Local Database</button>
               </div>


          </div>

          <App source={this.state.source}/>
      </div>
    )
  }
}