<?php

/*
 * Copyright 2019 John Dimm -- All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license.
 */

function getParam($paramName, $defaultValue) {
    return (isset($_GET[$paramName])) ?  $_GET[$paramName] : $defaultValue;
}


function postParam($paramName, $defaultValue) {
    return (isset($_POST[$paramName])) ?  $_POST[$paramName] : $defaultValue;
}


function dbInit() {
  include "mysql_connect.php";

  $connection_string = "mysql:host=$mysql_host;dbname=$mysql_database;charset=utf8";


  // Connecting, selecting database
  $connection = new PDO(
      $connection_string
    , $mysql_user
    , $mysql_password
  );

  return $connection;
}

function dbUpdate($connection, $sql) {
  $result = $connection->query($sql);
  return $connection->lastInsertId();
}


function breakdown($db, $source) {
    // The breakdown stored procedure has three params.
    $whereClause = postParam('whereClause', '');
    $groupBy = postParam('groupBy', 'city');
    $orderBy = postParam('orderBy', '');

    // echo $whereClause . "\n";

    $sql = "call breakdown(:source, :whereClause, :groupBy, :orderBy)";

    // Call the breakdown stored procedure in mysql.
    $sth = $db->prepare($sql, array(PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY));
    $result = $sth->execute(array(
      ':source' => $source,
      ':whereClause' => $whereClause,
      ':groupBy' => $groupBy,
      ':orderBy' => $orderBy
     ));

    outputX($sth);
}

function generic($db, $proc) {
    // Generic stored procedure has 1 param.
    $param = postParam('param', '1');

    $sql = "call $proc(:param)";

    $sth = $db->prepare($sql, array(PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY));
    $result = $sth->execute(array(
      ':param' => $param
    ));

    outputX($sth);
}

function dimCounts($db, $source) {
    // echo "dimCounts";
    // return;

    $whereClause = postParam('whereClause', '');
    $countDistinct = postParam('countDistinct', "count(distinct genres) as genres");
    # ,count(distinct original_language) as original_language,count(distinct production_countries) as production_countries,count(distinct spoken_languages) as spoken_languages,count(distinct status) as status,count(distinct video) as video,count(distinct vote_average) as vote_average");

    $sql = "call dim_counts(:source, :whereClause, :countDistinct)";

    // echo $sql;

    $sth = $db->prepare($sql, array(PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY));
    $result = $sth->execute(array(
      ':source' => $source,
      ':whereClause' => $whereClause,
      ':countDistinct' => $countDistinct
    ));

    outputX($sth);
}

function detail($db, $source) {
    $whereClause = postParam('whereClause', 'Country="Estonia" and Sport="Rowing"');
    $orderBy = postParam('orderBy', '');
    $limit = postParam('limit', ' limit 20 ');

    $sql = "call detail(:source, :whereClause, :orderBy, :limit)";

    $sth = $db->prepare($sql, array(PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY));
    $result = $sth->execute(array(
      ':source' => $source,
      ':whereClause' => $whereClause,
      ':orderBy' => $orderBy,
      ':limit' => $limit
      )
    );

    outputX($sth);
}


function outputCSV ($sth) {
  $lines = [];

  while($row = $sth->fetch(PDO::FETCH_ASSOC)) {
     // echo json_encode($row) . "\n";
     if (count($lines) == 0) {
       $header = join("\t", array_keys($row));
       array_push($lines, $header);
     }

     $line = join($row, "\t");
     array_push($lines, $line);
  }

  echo join("\n", $lines);
}


function outputJSON($sth) {
    $output = $sth->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($output);
}

function  outputX($sth) {
    $format = postParam('format', 'json');
    if ($format == 'json')
      outputJSON($sth);
    else if ($format == 'csv')
      outputCSV($sth);
}


function main() {
  // echo "mysql php starts";
  $db = dbInit();
  $proc = postParam('proc', 'dim_counts');
  $source = postParam('source', 'oscars');

  switch ($proc) {
    case 'breakdown':
      breakdown($db, $source);
      break;
    case 'dim_counts':
      dimCounts($db, $source);
      break;
    case 'detail':
      detail($db, $source);
      break;
    default:
      generic($db, $proc);
  }

}

main();

?>
