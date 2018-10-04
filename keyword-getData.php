<?php
require_once 'basics.php';
$data_type=intval($_REQUEST['data_type']);
$site_id=intval($_REQUEST['site_id']);
$days=isset($_REQUEST['days'])?intval($_REQUEST['days']):28;
$field='importance';
switch ($_REQUEST['type']) {
	case 'impressions': $field='impressions'; break;
	case 'position': $field='position'; break;
	case 'clicks': $field='clicks'; break;
}
$rs=dbAll('select '.$field.' as amt, date(cdate) as cdate from data where cdate>date_add(now(), interval -'.$days.' day) and keyword_id='.intval($_REQUEST['id']).' and data_type='.$data_type.' and site_id='.$site_id);
$data=[];
foreach ($rs as $r) {
	$data[]=[$r['cdate'], floatval($r['amt'])];
}
header('Content-type: text/json');
echo json_encode($data);
