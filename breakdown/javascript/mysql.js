Mysql = function() {

    this.init = function() {
        renderRoot();
        return;

        setTimeout (function() {

          // Start it up.
          renderRoot()
        }, 100);
    }

    this.queryCounts = function(dims, _filters, dataset, fnSuccess) {

        var c = [];
        dims.forEach(function(key, i) {
          c.push("count(distinct `" + key + "`) as `" + key + "`");
        });
        var countDistinct = c.join(",");

        var whereClause = _filters;

        var data = new FormData();
        data.append ('proc','dim_counts');
        data.append('countDistinct',countDistinct);
        data.append('whereClause', whereClause);
        data.append('dataset', dataset);

        fetch("php/mysql.php",{
          method: "POST",
          body: data
        })
          .then(function (response) {
              return response.json();
        }).then(function (result) {
            fnSuccess(result[0]);
        }.bind(this));
    }

    this.breakdown = function(data, fnSuccess) {
        fetch("php/mysql.php",{
          method: "POST",
          body: data
        })
          .then(function (response) {
              return response.ok ? response.text() : Promise.reject(response.status);
        }.bind(this)).then(function (result) {
              // renderRoot();
              fnSuccess(eval(result));
        }.bind(this));
    }


    this.getBreakdownSources = function(fnSuccess) {
        var data = new FormData();
        data.append ('proc','get_breakdown_datasets');
        data.append('param','');

        fetch("php/mysql.php",{
          method: "POST",
          body: data
        })
          .then(function (response) {
              return response.json();
        }).then(function (result) {
          // result.forEach(function(dataset, i) {
          //   dataset.dimensions = dataset.dimensions.split(",");
          //   dataset.measures = dataset.measures.split(",");
          // });
           fnSuccess(result);
        }.bind(this));
    }

    this.getDetail = function(params, fnSuccess) {
        var data = new FormData();
        data.append( 'proc', 'detail' );
        data.append( 'whereClause', params.whereClause);
        data.append( 'format', 'csv' );
        data.append( 'limit', ' limit ' + params.limit );
        data.append('dataset', params.dataset);

        var orderBy = params.orderBy;
        if (orderBy != '')
          orderBy += ' ' + params.sortDir;
        data.append( 'orderBy', orderBy);

        fetch("php/mysql.php",{
          method: "POST",
          body: data
        })
          .then(function (response) {
              return response.ok ? response.text() : Promise.reject(response.status);
        }.bind(this)).then(function (result) {
          var lines = result.split("\n");
          fnSuccess(lines);
        });
    }

};


