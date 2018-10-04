<?php
require_once 'config.php';
require_once 'vendor/autoload.php';

function dbRow($query, $cache = FALSE) {
  if (!preg_match('/ limit 1$/', $query)) {
    $query .= ' limit 1';
  }
  if ($cache) {
    $q = Core_cacheLoad($cache, $query, -1);
    if ($q != -1) {
      return $q;
    }
  }
  $q = dbQuery($query);
  if ($q === FALSE) {
    $r = FALSE;
  }
  else {
    $r = $q->fetch(PDO::FETCH_ASSOC);
  }
  if ($cache) {
    Core_cacheSave($cache, $query, $r);
  }
  return $r;
}
function dbQuery($query, $cache = FALSE, $pid = 0, $returnCount=false) {
  $db = dbInit();
  $q  = $db->query($query);
  if ($q === FALSE) { // failed
    error_log(json_encode($db->errorInfo()));
    error_log($query);
    error_log(__FILE__.'|'.__LINE__.'|'.$_SERVER['REQUEST_URI'].'|'.(isset($_SESSION['userdata'])?json_encode($_SESSION['userdata']):'not logged in'));
    return FALSE;
  }
  $count=$q->rowCount();
  $db->num_queries++;
  if ($cache) {
    if ($pid) {
      $dbp = 'user'.$pid.'_';
    }
    elseif (defined('DBP')) {
      $dbp = DBP;
    }
    elseif (isset($GLOBALS['pid'])) {
      $dbp = 'user'.$GLOBALS['pid'].'_';
    }
    else {
      return $q;
    }
    $r = dbOne('select value from '.$dbp.'site_vars where name="dbupdates"', 'value');
    if ($r === FALSE) {
      $r = [];
    }
    else {
      $r = json_decode($r, TRUE);
      $db->query('delete from '.$dbp.'site_vars where name="dbupdates"');
    }
    $r[$cache] = date('Y-m-d H:i:s');
    $sql1   = 'insert into ';
    $sql2   = ', name="dbupdates"';
    $db->query($sql1.' '.$dbp.'site_vars set value="'.addslashes(json_encode($r)).'"'.$sql2);
  }
  return $returnCount?$count:$q;
}
function dbOne($query, $field = '', $cache = FALSE) {
  if (!preg_match('/ limit 1$/', $query)) {
    $query .= ' limit 1';
  }
  if ($cache) {
    $r = Core_cacheLoad($cache, $query, -1);
    if ($r === -1) {
      $r = dbRow($query);
      Core_cacheSave($cache, $query, $r);
    }
  }
  else {
    $r = dbRow($query);
  }
  if ($r === FALSE) {
    return FALSE;
  }
  return $r[$field];
}
function dbLastInsertId() {
  return (int)dbOne('select last_insert_id() as id', 'id');
}
function dbInit() {
  if (isset($GLOBALS['db'])) {
    return $GLOBALS['db'];
  }
  try {
    $cstr = 'mysql:host='.MYSQL_HOST.';dbname='.MYSQL_DBNAME;
    $db   = new PDO(
      $cstr,
      MYSQL_USERNAME,
      MYSQL_PASSWORD,
      [
       PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
       PDO::ATTR_PERSISTENT    => TRUE,
      ]
    );
  }
  catch (Exception $e) {
    die($e->getMessage());
  }
  $db->num_queries = 0;
  $GLOBALS['db']   = $db;
  return $db;
}
function dbAll($query, $key = '', $cache = FALSE) {
  if ($cache) {
    $q = Core_cacheLoad($cache, $query.'|'.$key, -1);
    if ($q !== -1) {
      return $q;
    }
  }
  $q = dbQuery($query);
  if ($q === FALSE) {
    if ($cache) {
      Core_cacheSave($cache, $query.'|'.$key, FALSE);
    }
    return FALSE;
  }
  $results = [];
  while ($r = $q->fetch(PDO::FETCH_ASSOC)) {
    $results[] = $r;
  }
  if (!$key) {
    if ($cache) {
      Core_cacheSave($cache, $query.'|', $results);
    }
    return $results;
  }
  $arr = [];
  foreach ($results as $r) {
    if (!isset($r[$key])) {
      return FALSE;
    }
    $arr[$r[$key]] = $r;
  }
  if ($cache) {
    Core_cacheSave($cache, $query.'|'.$key, $arr);
  }
  return $arr;
}

