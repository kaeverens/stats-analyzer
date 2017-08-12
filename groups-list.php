<?php
require_once 'basics.php';
header('Content-type: text/json');
$site_id=intval($_REQUEST['site_id']);
echo json_encode(dbAll('select id,name from groups where site_id='.$site_id));
