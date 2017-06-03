<?php
require_once 'basics.php';
$handle = fopen($_FILES["file"]["tmp_name"], "r");
$date=$_REQUEST['date'];

$linenum=0;
$site_id=intval($_REQUEST['site_id']);
$data = fgetcsv($handle, 1000, ",");
dbQuery('delete from data where site_id='.$site_id.' and cdate="'.$date.'"');
while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
	$keyword=dbRow('select * from keywords where site_id='.$site_id.' and name="'.addslashes($data[0]).'"');
	if (!$keyword) {
		dbQuery('insert into keywords set site_id='.$site_id.', name="'.addslashes($data[0]).'"');
		$keyword=dbRow('select * from keywords where site_id='.$site_id.' and name="'.addslashes($data[0]).'"');
	}
	dbQuery('insert into data set cdate="'.$date.'", site_id='.$site_id.', keyword_id='.$keyword['id'].', clicks='.$data[1].', impressions='.$data[2].', position='.$data[4]);
	$id=dbLastInsertId();
	$sum=dbRow('select sum(clicks) as clicks, sum(impressions) as impressions, avg(position) as position from data where keyword_id='.$keyword['id'].' and site_id='.$site_id.' and cdate>=date_add("'.$date.'", interval -28 day) and cdate<="'.$date.'"');
	$importance=(1+$sum['clicks']/$sum['impressions'])*($sum['impressions']/$sum['position']);
	dbQuery('update data set clicks28='.$sum['clicks'].', impressions28='.$sum['impressions'].', position28='.$sum['position'].', importance='.$importance.' where id='.$id);
	$hasNewer=dbOne('select id from data where keyword_id='.$keyword['id'].' and cdate>"'.$date.'"', 'id');
	if (!$hasNewer) {
		dbQuery('update keywords set last_seen="'.$date.'", importance='.$importance.' where id='.$keyword['id']);
	}
}
fclose($handle);
