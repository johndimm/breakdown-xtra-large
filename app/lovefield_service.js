/**
 * @license
 * Copyright 2015 The Lovefield Project Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



/**
 * A singleton service used by the rest of the application to make calls to the
 * Lovefield API.
 * @constructor
 */


function LovefieldService() {
  // Following member variables are initialized within getDbConnection().
  this.fact_ = null;
  this.db_ = null;

  window.ls = this;
  this.data = null;



/**
 * Initializes member variables that can't be initialized before getting a
 * connection to the database.
 * @private
 */
  this.onConnected_ = function() {
  this.fact_ = this.db_.getSchema().table('fact');
  var fact = this.fact_;

  var dataRows = this.data.map(
      function(obj) {
        return this.fact_.createRow(obj);
      }, this);


  var q1 = this.db_.
      insert().
      into(this.fact_).
      values(dataRows);


  // Updating both tables within a single transaction.
  var tx = this.db_.createTransaction();
  return tx.exec([q1]).then (this.query());


  // Creating a two parametrized queries. Parameters will be bound to actual
  // values before executing such queries.

  /*
  this.stockClosingPricesQuery_ = this.db_.
      select().
      from(hd).
      where(lf.op.and(
          hd.Date.between(lf.bind(0), lf.bind(1)),
          hd.Stock.eq(lf.bind(2)))).
      orderBy(hd.Date, lf.Order.ASC);

  this.sectorClosingPricesQuery_ = this.db_.
      select(lf.fn.avg(hd.Close), si.Sector, hd.Date).
      from(hd, si).
      where(lf.op.and(
          hd.Stock.eq(si.Stock), // join predicate on the common field 'Stock'
          hd.Date.between(lf.bind(0), lf.bind(1)),
          si.Sector.eq(lf.bind(2)))).
      orderBy(hd.Date, lf.Order.ASC).
      groupBy(si.Sector, hd.Date);
*/


}



/**
 * Instantiates the DB connection (re-entrant).
 * @return {!IThenable<!lf.Database>}
 */
  this.getDbConnection = function() {
  if (this.db_ != null) {
    return this.db_;
  }

  var connectOptions = {storeType: lf.schema.DataStoreType.INDEXED_DB};
  return this.buildSchema_().connect(connectOptions).then(
      function(db) {
        this.db_ = db;
        this.onConnected_();
        return db;
      }.bind(this));
  }


  this.query = function() {

    this.db_.select().from(this.fact_).exec()
      .then(function(results) {
         results.forEach(function(row) {
          console.log(row);
      })});

    return;

     var results = this.db_.
      select(this.fact_.Sport).
      from(this.fact_).
      exec();

     console.log(results);
  }


/**
 * Builds the database schema.
 * @return {!lf.schema.Builder}
 * @private
 */
this.buildSchema_ = function() {


  var schemaBuilder = lf.schema.create('breakdown', 1);
  var factTable = schemaBuilder.createTable('fact');


      var FILE_KEY = 'save.json'

      var content = localStorage.getItem(FILE_KEY);
      this.data = $.csv.toObjects(content);
      var header = Object.keys(this.data[0]);

  header.forEach(function(key, i) {
    factTable.addColumn(key, lf.Type.STRING);
  });
  /*
      addColumn('Close', lf.Type.NUMBER).
      addColumn('Date', lf.Type.DATE_TIME).
      addColumn('High', lf.Type.NUMBER).
      addColumn('Low', lf.Type.NUMBER).
      addColumn('Open', lf.Type.NUMBER).
      addColumn('Stock', lf.Type.STRING).
      addColumn('Volume', lf.Type.INTEGER).
      addIndex('idx_stock', ['Stock']);
*/

  return schemaBuilder;
}

};
