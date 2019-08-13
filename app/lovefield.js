function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function pad(n){return n<10 ? '0'+n : n}

function clean(s) {
  return s.replace(/[^a-zA-Z0-9]/gmi, "");
}

var displayName = {};


class Datasets {

    init() {
        this.ds = {};
        var s = localStorage.getItem('breakdown_datasets');
        if (s == null || s == '')
          return;
        this.ds = JSON.parse(s);
        return;

        //
        // Create the list of datasets.
        //
        var datasets = JSON.parse(s);


        this.ds = {};
        datasets.forEach(function(d, i) {
           this.ds[d.name] = d;
        }.bind(this));

    }

    breakdown_datasets() {
      return  Object.keys(this.ds).map(function(key, i) {
        return this.ds[key];
      }.bind(this))
    }

    add(datasetObj) {
      this.ds[datasetObj.name] = datasetObj;
    }

    save() {
      localStorage.setItem('breakdown_datasets', JSON.stringify(this.ds));
    }


}


class Lovefield  {

    init() {
        this.dbName = 'breakdown';
        this.dbVersion = 1;
        this.tableName = '';
        // this.FILE_KEY = 'save.json';
        this.HEADER_KEY = 'header.json';
        this.SOURCES_KEY = 'breakdown_datasets';
        // this.schemaBuilder;
        this.db = null;
        this.fact;
        this.filters;
        this.header = null;
        this.types = [];
        this.data = null;

        this.datasets = new Datasets();
        this.datasets.init();
    }


    buildSchema() {
        this.schemaBuilder = lf.schema.create(this.dbName, this.getDBVersion());

        //
        // Create the tables.
        //
        this.datasets.breakdown_datasets().forEach(function(key,i) {
           this.createTable(key);
        }.bind(this));
    }

    connect(data, dataset, fnSuccess) {
        //
        // Connect and open the database.
        //

        // Do this only once per session.
        if (this.db != null)
          return;

        this.datasets.init();
        this.buildSchema();

        // Set progress cursor.
        $('body').addClass('waiting');

        $('#import_instructions').css('display', 'none');
        $('#import_instructions_button').css('display', 'block');


        this.schemaBuilder.connect().then(function(_db) {
            this.db = _db;
            $('#grayed_out').remove();

            if (data != null) {
                var lfTable = this.db.getSchema().table(dataset.fact_table);
                this.load(lfTable, data, dataset.aggregates.split(","), function() {
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

    xformMint(obj) {
      // "Date","Description","Original Description","Amount","Transaction Type","Category","Account Name","Labels","Notes"
      //      var cols = "Account,Category,Description,Year,Month,Date,Labels,Notes,Amount";

        if (!this.isMint) {
          return obj;
        }

        var date = new Date(obj["Date"]);
        var year = date.getFullYear();
        var month = pad(date.getMonth() + 1);
        var day = pad(date.getDate());

        var out = {};
        out["Account"] = obj["Account Name"];
        out["Category"] = obj["Category"];
        out["Description"] = obj["Description"];
        out["Year"] = year.toString();
        out["Month"] = year + '-' + month;
        out["Date"] = year + '-' + month + '-' + day;
        out["Labels"] = obj["Labels"];
        out["Notes"] = obj["Notes"];
        out["Amount"] = obj["Amount"] * (obj["Transaction Type"] == 'debit' ? -1 : 1);

        return out;
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

            var obj_fixed = this.xformMint(obj);

            //  obj.Funding = parseFloat(obj.Funding);
            return factTable.createRow(obj_fixed);
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

    setSource(dataset) {
      // if (this.db != null)
        this.fact = this.db.getSchema().table(dataset.fact_table);
    }


    getBreakdownSources() {
       return this.datasets.breakdown_datasets();
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

    addBreakdownSource (datasetName, headerArray, lineArray) {
       displayName[clean(datasetName)] = datasetName;

       var tableName = clean(datasetName) + "_fact";

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
          var head = headerArray[i];
          displayName[clean(head)] = head;

          var fieldName = clean(head);
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

       var datasetObj = {
                   database: 'lovefield',
                   name: datasetName,
                   fact_table: tableName, // this.datasetName, // 'fact',
                   summary_table: tableName, // 'fact',
                   dimensions: dimensions.join(','), // 'Sport,Discipline,Athlete,Event,Country,Medal,Year,Season,Gender,City',
                   measures: measures.join(','),

                   fields: fields.join(','),
                   types: this.types.join(','),

                   dim_metadata_table: '',
                   dim_metadata: {},
                   aggregates: aggregates.join(','),
                   page_title: 'Breakdown: ' + datasetName
              };


       this.datasets.add(datasetObj);
       this.datasets.save();


       this.incrementDBVersion();

       return datasetObj
     }

    createTable(dataset) {
        var factTable = this.schemaBuilder.createTable(dataset.fact_table);
        var typeArray = dataset.types.split(',');

        var fieldArray = dataset.fields.split(",");
        fieldArray.forEach(function(columnName, i) {
           var fieldType = typeArray[i] == 'NUMBER' ? lf.Type.NUMBER : lf.Type.STRING;

           //
           // Assign column name.
           //
          // var col_cleaned = columnName.replace(/[^a-zA-Z0-9]/gmi, "");
           factTable.addColumn(columnName, fieldType);
          // factTable[col_cleaned].name = columnName;
        });
    }


    addSource(datasetName, content, fnSuccess) {
      this.import_dataset = datasetName;
      this.import_data = $.csv.toObjects(content);
      this.import_fnSuccess = fnSuccess;
      this.import_header = Object.keys(this.import_data[0]);
      this.isMint = false;

      //
      // Special handling for data from Mint.
      //
      var mintCols = ["Date","Description","Original Description","Amount","Transaction Type","Category","Account Name","Labels","Notes"];
      if (mintCols.join(",") == this.import_header.join(",")) {
        var cols = "Account,Category,Description,Year,Month,Date,Labels,Notes,Amount";
        this.import_header = cols.split(",");
        var types = "STRING,STRING,STRING,STRING,STRING,STRING,STRING,STRING,NUMBER";
        this.types = types.split(",");
        this.isMint = true;
      } else {
        this.import_line = this.import_header.map(function(key, i) {
          return this.import_data[1][key];
        }.bind(this));

//        this.import_header.forEach(function(key,i) {
//            this.import_header[i] = this.import_header[i].replace(/[^a-zA-Z0-9]/gmi, "");
//        }.bind(this));

        this.guessColumnTypes(this.import_line, this.import_header);
      }

      this.import_dataset = this.addBreakdownSource(this.import_dataset, this.import_header, this.import_line);
      this.init();
      this.connect(this.import_data, this.import_dataset, this.import_fnSuccess);
    }


    queryCounts(dims, _filters, dataset, fnSuccess) {
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


