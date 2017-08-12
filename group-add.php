<?php
require_once 'basics.php';
header('Content-type: text/json');
$site_id=intval($_REQUEST['site_id']);
$name=$_REQUEST['name'];
$row=dbRow('select id,name from groups where name="'.addslashes($name).'" and site_id='.$site_id);
if ($row) {
	echo json_encode($row);
}
dbQuery('insert into groups set name="'.addslashes($name).'", site_id='.$site_id);
$row=dbRow('select id,name from groups where name="'.addslashes($name).'" and site_id='.$site_id);
echo json_encode($row);
