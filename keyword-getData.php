<?php
require_once 'basics.php';
/*

mysql> describe data;
+---------------+----------+------+-----+---------+----------------+
| Field         | Type     | Null | Key | Default | Extra          |
+---------------+----------+------+-----+---------+----------------+
| id            | int(11)  | NO   | PRI | NULL    | auto_increment |
| cdate         | datetime | YES  |     | NULL    |                |
| keyword_id    | int(11)  | YES  | MUL | 0       |                |
| clicks        | int(11)  | YES  |     | 0       |                |
| impressions   | int(11)  | YES  |     | 0       |                |
| position      | int(11)  | YES  |     | 0       |                |
| site_id       | int(11)  | YES  |     | NULL    |                |
| clicks28      | int(11)  | YES  |     | 0       |                |
| impressions28 | int(11)  | YES  |     | 0       |                |
| position28    | float    | YES  |     | 0       |                |
| importance    | float    | YES  |     | 0       |                |
+---------------+----------+------+-----+---------+----------------+
11 rows in set (0.01 sec)


*/
$data_type=intval($_REQUEST['data_type']);
$site_id=intval($_REQUEST['site_id']);
$field='importance';
switch ($_REQUEST['type']) {
	case 'impressions': $field='impressions'; break;
	case 'position': $field='position'; break;
	case 'clicks': $field='clicks'; break;
}
$rs=dbAll('select '.$field.' as amt, date(cdate) as cdate from data where keyword_id='.intval($_REQUEST['id']).' and data_type='.$data_type.' and site_id='.$site_id);
$data=[];
foreach ($rs as $r) {
	$data[]=[$r['cdate'], floatval($r['amt'])];
}
header('Content-type: text/json');
echo json_encode($data);
