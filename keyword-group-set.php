<?php
require_once 'basics.php';
header('Content-type: text/json');
$keyword_id=intval($_REQUEST['keyword_id']);
$group_id=intval($_REQUEST['group_id']);
dbQuery('update keywords set group_id='.$group_id.' where id='.$keyword_id);
echo json_encode(['ok'=>1]);
