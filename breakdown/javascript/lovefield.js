function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function pad(n){return n<10 ? '0'+n : n}

function clean(s) {
  return s.replace(/[^_a-zA-Z0-9]/gmi, "");
}

var displayName = {};


class PersonalCapital {
  columns() {
    return "Date,Account,Description,Category,Tags,Amount";
  }
  
  cols() {
    return "Account,Category,Description,Year,Month,Date,Tags,Amount";
  }

  types() {
    return "STRING,STRING,STRING,STRING,STRING,STRING,STRING,NUMBER";
  }

    convert(obj) {
        var dateStr = obj["Date"];
        if (dateStr == null)
          return obj;

        var date = new Date(dateStr);
        var year = date.getFullYear();
        var month = pad(date.getMonth() + 1);
        var day = pad(date.getDate());

        var out = {};
        out["Account"] = obj["Account"];
        out["Category"] = obj["Category"];
        out["Description"] = obj["Description"];

        out["Year"] = year.toString();
        out["Month"] = year + '-' + month;
        out["Date"] = year + '-' + month + '-' + day;

        out["Tags"] = obj["Tags"];
        out["Amount"] = obj["Amount"] * (obj["Transaction Type"] == 'debit' ? -1 : 1);

        return out;
    }
}

class Mint {
  columns() {
    return "Date,Description,Original Description,Amount,Transaction Type,Category,Account Name,Labels,Notes";
  }

  cols() {
    return "Account,Category,Description,Original_Description,Year,Month,Date,Labels,Notes,Amount";
  }

  types() {
    return  "STRING,STRING,STRING,STRING,STRING,STRING,STRING,STRING,STRING,NUMBER";
  }

  convert(obj) {
        var dateStr = obj["Date"];
        if (dateStr == null)
          return obj;

        var date = new Date(dateStr);
        var year = date.getFullYear();
        var month = pad(date.getMonth() + 1);
        var day = pad(date.getDate());

        var out = {};
        out["Account"] = obj["Account Name"];
        out["Category"] = obj["Category"];
        out["Description"] = obj["Description"];
        out["Original_Description"] = obj["Original Description"];

        out["Year"] = year.toString();
        out["Month"] = year + '-' + month;
        out["Date"] = year + '-' + month + '-' + day;

        out["Labels"] = obj["Labels"];
        out["Notes"] = obj["Notes"];
        out["Amount"] = obj["Amount"] * (obj["Transaction Type"] == 'debit' ? -1 : 1);

        return out;
    }

}

var mint = new Mint();
var personalCapital = new PersonalCapital();

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
//                    $('body').removeClass('waiting');

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

    expandDateField(obj) {



        return obj;
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

            if (this.isMint)
              obj = mint.convert(obj);
             else if (this.isPersonalCapital)
               obj = personalCapital.convert(obj);

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

    addBreakdownSource (datasetName, filename, headerArray, lineArray) {
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
                   fact_table: tableName,
                   summary_table: tableName,
                   dimensions: dimensions.join(','),
                   measures: measures.join(','),

                   fields: fields.join(','),
                   types: this.types.join(','),

                   dim_metadata_table: '',
                   dim_metadata: {},
                   aggregates: aggregates.join(','),
                   page_title: this.isMint
                     ? 'Breakdown for Mint'
                     : this.isPersonalCapital
                       ? 'Breakdown for Personal Capital'
                       : 'Breakdown: ' + filename
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


    addSource(datasetName, filename, content, fnSuccess) {
      this.import_dataset = datasetName;
      this.import_data = $.csv.toObjects(content);
      this.import_fnSuccess = fnSuccess;
      this.import_header = Object.keys(this.import_data[0]);

      //
      // Special handling for data from Mint.
      //
      var headerStr = this.import_header.join(",")
      this.isMint = mint.columns() == headerStr;
      this.isPersonalCapital = personalCapital.columns() == headerStr;

      if (this.isMint) {
        this.import_header = mint.cols().split(",");
        this.types = mint.types().split(",");
      } else if (this.isPersonalCapital) {
        this.import_header = personalCapital.cols().split(",");
        this.types = personalCapital.types().split(",");
      } else {
        //
        // Get a sample value from the first line of data.
        //
        this.import_line = this.import_header.map(function(key, i) {
            return this.import_data[1][key];
        }.bind(this));

        //
        // Fix column names that won't work for lovefield.
        //
        this.import_header.forEach(function(key,i) {
            this.import_header[i] = this.import_header[i].replace(/[^a-zA-Z0-9_]/gmi, "");
        }.bind(this));

        this.guessColumnTypes(this.import_line, this.import_header);
      }

      this.import_dataset = this.addBreakdownSource(this.import_dataset, filename, this.import_header, this.import_line);
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
        var conditions = [];

        var searchText = $("#search_description").val();
        if (searchText)
          conditions.push("this.fact['Description'].match(/" + searchText + "/i)");

        if (_filters != null) {

        var filters = _filters.split(' AND ');
            if (filters != '') {
                filters.forEach(function(key, i) {
                   var re = /\`(.*)\`\s*=\s*'(.*)'/;
                   var matches = re.exec(key);
                   var key = matches[1];
                   var value = matches[2];
                   conditions.push("this.fact['" + key + "'].eq('" + value + "')");
                });

            }
        }

        if (conditions.length != 0) {
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


        var sortColName = '';
        if (aggregates != 'undefined' && aggregates != "") {
            var aggArray = aggregates.split(",");
            aggArray.forEach (function(key, i) {
              fields.push(lf.fn.sum(this.fact[key]).as(key));
              if (i==0 && orderBy == "2 DESC")
                orderBy = key + " DESC";
            }.bind(this));
        }

        fields.push(lf.fn.count('').as('count'));

        // Use spread.
        this.select = this.db.select(...fields).from(this.fact);
        this.addWhere(this.select, _filters);

        // XXXX Sort only by count for now.  Must allow order by the group by column.
        // this.select.orderBy(lf.fn.count(), lf.Order.DESC);

        var parts = orderBy.split(" ");
        var sortColName = parts[0];
        var dir = parts[1];

        // colName = "SUM(" + colName + ")";
        if (sortColName == '1')
          sortColName = groupBy;

        var orderByColumn = sortColName == 'count'
          ? lf.fn.count()
          : lf.fn.sum(this.fact[sortColName]);

        var direction = dir == 'DESC' ? lf.Order.DESC : lf.Order.ASC;

        this.select
          .groupBy(this.fact[groupBy])
          .orderBy(orderByColumn, direction)
          .exec()
          .then(function(results) {
            fnSuccess(results);
            setTimeout(function() {$('body').removeClass('waiting')}, 1000);
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
          .limit(params.limit)
          .exec()
          .then(function(results) {
            var rows = [];
            var header = Object.keys(results[0]);
            rows.push(header.join("\t"));

            for (var i=0; i<Math.min(params.limit,results.length); i++) {
              var row = [];
              var r = results[i];
              header.forEach(function(key, j) {
                row.push(r[key]);
              });
              rows.push(row.join("\t"));
            }
            if (fnSuccess != null)
              fnSuccess(rows);
           });
    }

};


