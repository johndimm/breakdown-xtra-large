<?php

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


function breakdown($db) {
    // The breakdown stored procedure has three params.
    $whereClause = postParam('whereClause', '');
    $groupBy = postParam('groupBy', 'sport');
    $orderBy = postParam('orderBy', '');

    $sql = "call breakdown(:whereClause, :groupBy, :orderBy)";

    // Call the breakdown stored procedure in mysql.
    $sth = $db->prepare($sql, array(PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY));
    $result = $sth->execute(array(
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

function dimCounts($db) {
    $whereClause = postParam('whereClause', '');
    $countDistinct = postParam('countDistinct', 'count(distinct sport) as sport');

    $sql = "call dim_counts(:whereClause, :countDistinct)";

    $sth = $db->prepare($sql, array(PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY));
    $result = $sth->execute(array(
      ':whereClause' => $whereClause,
      ':countDistinct' => $countDistinct
    ));

    outputX($sth);
}

function detail($db) {
    $whereClause = postParam('whereClause', '');
    $limit = postParam('limit', ' limit 20 ');

    $sql = "call detail(:whereClause, :limit)";

    $sth = $db->prepare($sql, array(PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY));
    $result = $sth->execute(array(
      ':whereClause' => $whereClause,
      ':limit' => $limit
      )
    );

    outputX($sth);
}


function outputCSV ($sth) {
  $lines = [];

  while($row = $sth->fetch(PDO::FETCH_ASSOC)) {
     if (count($lines) == 0) {
       $header = join("\t", array_keys($row));
       array_push($lines, $header);
       next;
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
  $db = dbInit();
  $proc = postParam('proc', 'dim_counts');

  switch ($proc) {
    case 'breakdown':
      breakdown($db);
      break;
    case 'dim_counts':
      dimCounts($db);
      break;
    case 'detail':
      detail($db);
      break;
    default:
      generic($db, $proc);
  }

}

main();

?>
