class Catalog extends React.Component {

  constructor(props, context) {
    super(props, context);

    // Setup file reading
    this.reader = new FileReader();
    this.reader.onload = this.handleFileRead.bind(this);

    this.source_set = {};
    this.state = {source: {}};
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

    this.source_set[r.name] = r;
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
      this.source_set[source_set_name].dim_metadata = dim_metadata;

      // Set source here for one with metadata.
//      this.setSource(source_set_name);

    }.bind(this)
    );

  }

  setSourceName(key) {
    var source = this.source_set[key];
    if (! isEmptyObject(source)) {
      this.setState({source:source, datasetName: key});
//      if (source.database == 'lovefield')
//        lovefield.setSource(source.fact_table, null, source.dimensions);
    }
  }

  toggleDatasets() {
    var on = $("#datasets").css('display') != 'none';

    $("#datasets").css('display', on ? 'none' : 'block');
  }

  printDatasetLink(requestedDatabase, key, i) {

          var page_title = this.source_set[key].page_title;
          var description = this.source_set[key].description;
          var database = this.source_set[key].database;
          var google_sheet = this.source_set[key].google_sheet;

          if (database != requestedDatabase)
            return null;

          var img = requestedDatabase == 'mysql' ?   (  <img src={key + '.jpg'} width="200" />) : (<span></span>);
          var google_sheet = google_sheet == null || google_sheet == ''
             ? ''
             : (<a  target="_blank" href={google_sheet}>google sheet</a>);

          var url = this.source_set[key].url;
          return (
            <td key={i} className="dataset_cell"
                  onClick={function() {
                    this.toggleDatasets();
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

        lovefield.addSource(sourceName, content);
    }

  render() {


      var mysql =
      Object.keys(this.source_set).map(function(key, i) {
          return this.printDatasetLink('mysql', key, i);
        }.bind(this));

      var lovefield =
      Object.keys(this.source_set).map(function(key, i) {
          return this.printDatasetLink('lovefield', key, i);
      }.bind(this));


    return (
      <div>
          <div id='dataset_title' onClick={
          function() {
            this.toggleDatasets();
          }.bind(this)
          }>Datasets</div>

          <div id='datasets'>


               <h2>Online Public Data</h2>

               <table><tbody><tr>
               {mysql}
               </tr></tbody></table>

          <h2>Local Private Data</h2>

               Breakdown works with public data from cloud or private data on your own computer.
               Your data stays on your computer.  This program imports it into a local database and uses
               SQL to slice and dice.  The local javascript database is <a
               href='https://google.github.io/lovefield/'>Lovefield</a> by Google.


               <h3>import your csv file into your local Lovefield database:</h3>
               <ol>
                   <li>get some csv data organized as dimensions and measures.  For example, each of the online public
                   datasets above are available as google sheets, which you can save as csv.  Columns with numbers become
                   measures, columns with text become dimensions.
                   </li>
                   <li>import the csv file into breakdown by clicking the button below.
                   </li>
                   <li>
                   enjoy the refreshing feeling of surfing effortlessly through joint distributions of your data.
                   </li>
               </ol>

               <i>Note: your file never leaves your computer</i>
               <input type="file" name="files[]" id="fileUpload" onChange={this.handleFileUpload.bind(this)}/>

               <table><tbody><tr>
               {lovefield}
               </tr></tbody></table>



          </div>

          <App source={this.state.source}/>
      </div>
    )
  }
}