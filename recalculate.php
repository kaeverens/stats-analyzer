<?php
require_once 'basics.php';

$sites=dbAll('select id from sites');
foreach ($sites as $site) {
	$keywords=dbAll('select id,name from keywords where site_id='.$site['id']);
	foreach ($keywords as $keyword) {
		echo 'recalculating values from '.$keyword['name']."\n";
		$dates=dbAll('select id,cdate from data where keyword_id='.$keyword['id'].' order by cdate');
		$latest_date='';
		$importance=0;
		foreach ($dates as $date) {
			$sql='select sum(clicks) as clicks, sum(impressions) as impressions, avg(position) as position from data where keyword_id='.$keyword['id'].' and site_id='.$site['id'].' and cdate>=date_add("'.$date['cdate'].'", interval -28 day) and cdate<="'.$date['cdate'].'"';
			$sum=dbRow($sql);
			$latest_date=$date['cdate'];
			$importance=(1+$sum['clicks']/$sum['impressions'])*($sum['impressions']/$sum['position']);
			dbQuery('update data set clicks28='.$sum['clicks'].', impressions28='.$sum['impressions'].', position28='.$sum['position'].', importance='.$importance.' where id='.$date['id']);
		}
		dbQuery('update keywords set last_seen="'.$latest_date.'", importance='.$importance.' where id='.$keyword['id']);
	}
}
echo 'done';
