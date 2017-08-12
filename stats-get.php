<?php
require_once 'basics.php';

$site_id=intval($_REQUEST['site_id']);
$sql='select id,group_id,hide,name,last_seen,importance'
	.', (select clicks28 from data where keyword_id=keywords.id and cdate=last_seen and data_type=0) as clicks28'
	.', (select impressions28 from data where keyword_id=keywords.id and cdate=last_seen and data_type=0) as impressions28'
	.', (select position28 from data where keyword_id=keywords.id and cdate=last_seen and data_type=0) as position28'
	.' from keywords where site_id='.$site_id.' and last_seen>date_add(date(now()), interval -28 day) order by importance desc';
$keywords=dbAll($sql);
$sql='select id, name, last_impression, clicks, impressions, position, importance'
	.' from groups where site_id='.$site_id.' order by importance desc';
$groups=dbAll($sql);
if ($groups===false) {
	$groups=[];
}
header('Content-type: text/json');
echo json_encode([
	'keywords'=>$keywords,
	'groups'=>$groups
]);
