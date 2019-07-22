function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

Lovefield = function() {

    this.dbName = 'breakdown';
    this.dbVersion = 1;
    this.tableName = '';
    // this.FILE_KEY = 'save.json';
    this.HEADER_KEY = 'header.json';
    this.SOURCES_KEY = 'breakdown_sources';
    // this.schemaBuilder;
    this.db = null;
    this.fact;
    this.filters;
    this.header = null;
    this.data = null;


    this.init = function() {
        //
        // Open the database.
        //    Use localStorage to "recreate" (define really) the existing tables.
        //    Use localStorage to load data into a new table.
        //    Make sure the database version is increased to allow this new table as an upgrade.
        //


        this.schemaBuilder = lf.schema.create(this.dbName, this.getDBVersion());

        var s = localStorage.getItem('breakdown_sources');
        if (s == null || s == '')
          return;

        //
        // Create the tables.
        //
        var sources = s.split("\n");
        this.breakdown_sources = [];
        var typeArray = [];
        var fieldArray = [];
        sources.forEach(function(key,i) {
           this.createTable(key);
           this.breakdown_sources.push(key);
        }.bind(this));
    }

    this.connect = function(data, source, fnSuccess) {
        //
        // Connect and open the database.
        //

        // Do this only once per session.
        if (this.db != null)
          return;

        $('body').addClass('waiting');
        $('#import_instructions').css('display', 'none');

        this.schemaBuilder.connect().then(function(_db) {
            this.db = _db;
            $('#grayed_out').remove();
            $('body').removeClass('waiting');


            if (data != null) {
                var lfTable = this.db.getSchema().table(source.fact_table);
                this.load(lfTable, data, source.aggregates.split(","), function() {
                if (fnSuccess)
                   fnSuccess();
                });
            } else if (fnSuccess)
              fnSuccess();

        }.bind(this));
    }


     this.load = function(factTable, data, aggregates, fnSuccess) {
       this.db.delete().from(factTable).exec();
        var dataRows = data.map(
          function(obj, i) {
            // Fix up numeric rows.  The input should have them as Funding: 48, not Funding: "48".
            Object.keys(obj).forEach(function(key) {
              if (aggregates.find(function(val) {return val == key} )) {
                var val = isNaN(parseInt(obj[key]))
                  ? 0
                  : parseInt(obj[key]);
                obj[key] = val;
              }
            });
            //  obj.Funding = parseFloat(obj.Funding);
            return factTable.createRow(obj);
          }, this);

        var q1 = this.db.
          insert().
          into(factTable).
          values(dataRows);

        var tx = this.db.createTransaction();
        tx.exec([q1]).then(
            fnSuccess()
        );
    }

    this.getDBVersion = function() {
      return localStorage.getItem('lovefield_db_version') || 0;
    }

    this.incrementDBVersion = function() {
      var version = this.getDBVersion();
      var v = parseInt(version);
      v = v + 1;
      localStorage.setItem('lovefield_db_version', v);
    }

    this.setSource = function(source) {
       this.fact = this.db.getSchema().table(source.fact_table);
    }


    this.getBreakdownSources = function() {
       return this.breakdown_sources;
    }

    this.addBreakdownSource = function (sourceName, header, line) {
       var tableName = sourceName + "_fact";
       var current_list = localStorage.getItem('breakdown_sources');
       if (current_list == null)
         current_list = '';
       else
         current_list += "\n";

       //
       // Guess column types from the first line.
       // Should scan the whole table, or sample it.
       //
       var measures = [];
       var dimensions = [];
       var aggregates = [];
       var fields = [];
       var types = [];

       var lineArray = $.csv.toArray(line);

       lineArray.forEach(function(key,i) {
          var fieldName = header.split(',')[i];
          if (fieldName == '')
            return;
          fields.push(fieldName);

          // 
          // Some columns contain integers but should not be treated as measures.
          //
          if (
             isNumeric(key)
           //  && parseInt(key) == key
             && fieldName.toLowerCase().indexOf('id') == -1 
             && fieldName.toLowerCase().indexOf('year') == -1 
             && fieldName.toLowerCase().indexOf('version') == -1 
             ) {
          // if (false) {
          //  measures.push('SUM(' + fieldName + ")");
            measures.push(fieldName);
            aggregates.push (fieldName);
            types.push('NUMBER');
          }
          else {
            dimensions.push(fieldName);
            types.push('STRING');
          }

        });

//        measures.push("COUNT(*)")
       measures.push("count");

       //
       // Add this source to the list in localStorage.
       //

       var sourceObj = {
                   database: 'lovefield',
                   name: sourceName,
                   fact_table: tableName, // this.datasetName, // 'fact',
                   summary_table: tableName, // 'fact',
                   dimensions: dimensions.join(','), // 'Sport,Discipline,Athlete,Event,Country,Medal,Year,Season,Gender,City',
                   measures: measures.join(','),

                   fields: fields.join(','),
                   types: types.join(','),

                   dim_metadata_table: '',
                   dim_metadata: {},
                   d_array: [],                   m_array: [],
                   aggregates: aggregates.join(','),
                   page_title: 'Breakdown: ' + sourceName
              };
       var sourceJson = JSON.stringify(sourceObj);

       var breakdown_sources = current_list + sourceJson;
       localStorage.setItem('breakdown_sources', breakdown_sources);

       this.incrementDBVersion();

       return sourceJson;

     }

    this.createTable = function(sourceJson) {
        var source = JSON.parse(sourceJson);
        var factTable = this.schemaBuilder.createTable(source.fact_table);
        typeArray = source.types.split(',');

        fieldArray = source.fields.split(",");
        fieldArray.forEach(function(columnName, i) {
           var fieldType = typeArray[i] == 'NUMBER' ? lf.Type.NUMBER : lf.Type.STRING;
           factTable.addColumn(columnName, fieldType);
        });
    }


    this.addSource = function(sourceName, content, fnSuccess) {
      var cr = content.indexOf("\n");
      var header = content.substring(0, cr);
      var line = content.substring( cr + 1, content.indexOf("\n", cr + 1 ) );
      var source = this.addBreakdownSource(sourceName, header, line);
      // this.createTable(source);

      var data = $.csv.toObjects(content);
      this.init();
      this.connect(data, JSON.parse(source), fnSuccess);


      // Save in local storage for now, load into the database in the next session.
      // Lovefield can't connect twice.
 //     localStorage.setItem(sourceName, data);

      // Bring up the next session.
//      location.reload();
    }



    this.readLocalStorage = function() {
      var content = localStorage.getItem(this.FILE_KEY);
      if (content != null)
        return $.csv.toObjects(content);
      return null;
    }

    this.queryCounts = function(dims, _filters, source, fnSuccess) {
      if (this.db == null)
        return;

      var fields = dims.map(function(key,i) {
        return "lf.fn.count(lf.fn.distinct(this.fact['" + key + "']))";
      });

    // COUNT(DISTINCT(Athlete)): 26495
    // COUNT(DISTINCT(City)): 41

       var dbsel = "this.db.select(" + fields.join(',') + ")";
       this.select = eval(dbsel)
         .from(this.fact);

       this.addWhere(this.select, _filters);

       this.select.exec()
         .then(function(results) {
            var fixed = {};
            Object.keys(results[0]).forEach(function(key, i) {
              var re = /COUNT\(DISTINCT\(([^\)]*)\)\)/;
              var matches = re.exec(key);
              var fieldName = matches[1];
              var value = results[0][key];
              fixed[fieldName] = value;
            });

            fnSuccess(fixed);
          });
    }

    this.addWhere = function(select, _filters) {
        if (_filters == null)
          return;

        var filters = _filters.split(' AND ');
        var conditions = [];
        if (filters != '') {
            filters.forEach(function(key, i) {
               var re = /\`(.*)\`\s*=\s*'(.*)'/;
               var matches = re.exec(key);
               var key = matches[1];
               var value = matches[2];
               conditions.push("this.fact['" + key + "'].eq('" + value + "')");
            });

            var where = "lf.op.and(" + conditions.join(',') + ")";

            this.select.where( eval(where) );
        }
    }

    this.breakdown = function(data, fnSuccess) {
        if (this.db == null)
           return;

        var groupBy = data.get('groupBy');
        var _filters = data.get('whereClause');
        var orderBy = data.get('orderBy');
        var aggregates = data.get('aggregates');

        // Start creating the select statement.
        /*
        var parts = [];
        var db = this.db;
        var fact = this.fact;
        parts.push('db.select( fact(groupBy)');
        if (aggregates != 'undefined')
          parts.push(aggregates);
        parts.push("lf.fn.count('') )");
        var dynamic = parts.join(",");
        this.select = eval(dynamic);
        */


        var fields = [];
        fields.push(this.fact[groupBy]);


        if (aggregates != 'undefined' && aggregates != "") {
            var aggArray = aggregates.split(",");
            aggArray.forEach (function(key, i) {
              fields.push(lf.fn.sum(this.fact[key]).as(key));
            }.bind(this));
        }

        fields.push(lf.fn.count('').as('count'));

        // Use spread.
        this.select = this.db.select(...fields).from(this.fact);
        this.addWhere(this.select, _filters);

        // XXXX Sort only by count for now.  Must allow order by the group by column.
        // this.select.orderBy(lf.fn.count(), lf.Order.DESC);

        var parts = orderBy.split(" ");
        var colName = parts[0];
        // colName = "SUM(" + colName + ")";
        if (colName == '1')
          colName = groupBy;

        var dir = parts[1];

        var orderByColumn =  colName == '2' || colName == 'count'
          ? lf.fn.count()
          : lf.fn.sum(this.fact[colName]);

        var direction = dir == 'DESC' ? lf.Order.DESC : lf.Order.ASC;

        this.select
          .groupBy(this.fact[groupBy])
          .orderBy(orderByColumn, direction)
          .exec()
          .then(function(results) {
            fnSuccess(results);
           });

    }


    this.getDetail = function(params, fnSuccess) {
        if (this.db == null)
           return;

        this.select = this.db.select().from(this.fact);

        this.addWhere(this.select, params.whereClause);

        // XXXX Need to parse the orderBy request.
        // this.select.orderBy(this.fact['Sport'], params.sortDir='DESC' ? lf.Order.DESC : lf.Order.ASC);

        this.select
          .limit(1000)
          .exec()
          .then(function(results) {
            var rows = [];
            var header = Object.keys(results[0]);
            rows.push(header.join("\t"));

            for (var i=0; i<Math.min(100,results.length); i++) {
              var row = [];
              var r = results[i];
              header.forEach(function(key, j) {
                row.push(r[key]);
              });
              rows.push(row.join("\t"));
            }
            fnSuccess(rows);
           });
    }

};


