<?php
require_once 'basics.php';
$rs=dbAll('select importance,cdate from data where keyword_id='.intval($_REQUEST['id']));
header('Content-type: text/json');
echo json_encode($rs);
