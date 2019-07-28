function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

class Lovefield  {

    init() {
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
        this.types = [];
        this.data = null;
    }

    readBreakdownSources() {
        var s = localStorage.getItem('breakdown_sources');
        if (s == null || s == '')
          return;

        //
        // Create the list of sources.
        //
        this.breakdown_sources = JSON.parse(s);

        //var sources = s.split("\n");
        //sources.forEach(function(key,i) {
        //   this.breakdown_sources.push(key);
        //}.bind(this));
    }

    buildSchema() {
        this.schemaBuilder = lf.schema.create(this.dbName, this.getDBVersion());

        //
        // Create the tables.
        //
        this.breakdown_sources.forEach(function(key,i) {
           this.createTable(key);
        }.bind(this));
    }

    connect(data, source, fnSuccess) {
        //
        // Connect and open the database.
        //

        // Do this only once per session.
        if (this.db != null)
          return;

        this.readBreakdownSources();
        this.buildSchema();

        // Set progress cursor.
        $('body').addClass('waiting');

        $('#import_instructions').css('display', 'none');
        $('#import_instructions_button').css('display', 'block');


        this.schemaBuilder.connect().then(function(_db) {
            this.db = _db;
            $('#grayed_out').remove();

            if (data != null) {
                var lfTable = this.db.getSchema().table(source.fact_table);
                this.load(lfTable, data, source.aggregates.split(","), function() {
                // Stop progress cursor.
                $('body').removeClass('waiting');

                if (fnSuccess)
                   fnSuccess();
                });
            } else if (fnSuccess) {
                // Stop progress cursor.
                $('body').removeClass('waiting');
                fnSuccess();
            }

        }.bind(this));
    }


     load(factTable, data, aggregates, fnSuccess) {
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

    getDBVersion() {
      return localStorage.getItem('lovefield_db_version') || 0;
    }

    incrementDBVersion() {
      var version = this.getDBVersion();
      var v = parseInt(version);
      v = v + 1;
      localStorage.setItem('lovefield_db_version', v);
    }

    setSource(source) {
      // if (this.db != null)
        this.fact = this.db.getSchema().table(source.fact_table);
    }


    getBreakdownSources() {
       return this.breakdown_sources;
    }

    guessColumnTypes(lineArray, headerArray) {
        lineArray.forEach(function(key,i) {
          var fieldName = headerArray[i];
          if (fieldName == '')
            return;

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

            this.types.push('NUMBER');
          }
          else {
            this.types.push('STRING');
          }

        }.bind(this));
    }

    addBreakdownSource (sourceName, headerArray, lineArray) {
       var tableName = sourceName + "_fact";

       var current_list = [];
       var s = localStorage.getItem('breakdown_sources');
       if (s != null)
         current_list = JSON.parse(s);

       //
       // Guess column types from the first line.
       // Should scan the whole table, or sample it.
       //
       var measures = [];
       var dimensions = [];
       var aggregates = [];
       var fields = [];

       // var lineArray = $.csv.toArray(line);

       this.types.forEach(function(key,i) {
          var fieldName = headerArray[i];
          if (fieldName == '')
            return;

          fields.push(fieldName);

          // 
          // Some columns contain integers but should not be treated as measures.
          //
          if ( key == 'NUMBER') {
            measures.push(fieldName);
            aggregates.push (fieldName);
          }
          else {
            dimensions.push(fieldName);
          }
        });

       measures.push("count");

       var sourceObj = {
                   database: 'lovefield',
                   name: sourceName,
                   fact_table: tableName, // this.datasetName, // 'fact',
                   summary_table: tableName, // 'fact',
                   dimensions: dimensions.join(','), // 'Sport,Discipline,Athlete,Event,Country,Medal,Year,Season,Gender,City',
                   measures: measures.join(','),

                   fields: fields.join(','),
                   types: this.types.join(','),

                   dim_metadata_table: '',
                   dim_metadata: {},
                   d_array: [],                   m_array: [],
                   aggregates: aggregates.join(','),
                   page_title: 'Breakdown: ' + sourceName
              };

       current_list.push(sourceObj);
       var breakdown_sources = JSON.stringify(current_list);
       localStorage.setItem('breakdown_sources', breakdown_sources);

       this.incrementDBVersion();

       return sourceObj
     }

    createTable(source) {
        var factTable = this.schemaBuilder.createTable(source.fact_table);
        var typeArray = source.types.split(',');

        var fieldArray = source.fields.split(",");
        fieldArray.forEach(function(columnName, i) {
           var fieldType = typeArray[i] == 'NUMBER' ? lf.Type.NUMBER : lf.Type.STRING;
           factTable.addColumn(columnName, fieldType);
        });
    }


    addSource(sourceName, content, fnSuccess) {
      this.import_source = sourceName;
      this.import_data = $.csv.toObjects(content);
      this.import_fnSuccess = fnSuccess;
      this.import_header = Object.keys(this.import_data[0]);

      this.import_line = this.import_header.map(function(key, i) {
        return this.import_data[1][key];
      }.bind(this));

      this.guessColumnTypes(this.import_line, this.import_header);

      this.import_source = this.addBreakdownSource(this.import_source, this.import_header, this.import_line);
      this.init();
      this.connect(this.import_data, this.import_source, this.import_fnSuccess);
    }


    queryCounts(dims, _filters, source, fnSuccess) {
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

    addWhere(select, _filters) {
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

    breakdown(data, fnSuccess) {
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


    getDetail(params, fnSuccess) {
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


