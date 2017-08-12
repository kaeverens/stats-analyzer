<?php
require_once 'basics.php';

$sites=dbAll('select id from sites');
$days=28;


foreach ($sites as $site) {
	$keywords=dbAll('select id,name from keywords where site_id='.$site['id'].' and id>0');
	foreach ($keywords as $keyword) {
	continue;
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
	echo 'recalculating Overall scores'."\n";
	for ($i=$days;$i>1;--$i) {
		$sql='select avg(impressions) as impressions,avg(clicks) as clicks, avg(position) as position from data left join keywords on keyword_id=keywords.id where cdate=date_add(date(now()), interval -'.$i.' day) and hide=0 and data.data_type=0 and data.site_id='.$site['id'];
		$r=dbRow($sql);
		if ($r && $r['impressions']) {
			dbQuery('delete from data where data_type=1 and cdate=date_add(date(now()), interval -'.$i.' day) and site_id='.$site['id']);
			$sql='insert into data set impressions='.$r['impressions'].', clicks='.$r['clicks'].', position='.$r['position'].', keyword_id=0, data_type=1, cdate=date_add(date(now()), interval -'.$i.' day), site_id='.$site['id'];
			dbQuery($sql);
			$last_id=dbLastInsertId();
			$sql='select sum(clicks) as clicks, sum(impressions) as impressions, avg(position) as position from data where data_type=1 and keyword_id=0 and site_id='.$site['id'].' and cdate>=date_add(date_add(date(now()), interval -'.$i.' day), interval -28 day) and cdate<date_add(date(now()), interval -'.$i.' day)';
			$sum=dbRow($sql);
			$importance=(1+$sum['clicks']/$sum['impressions'])*($sum['impressions']/$sum['position']);
			dbQuery('update data set clicks28='.$sum['clicks'].', impressions28='.$sum['impressions'].', position28='.$sum['position'].', importance='.$importance.' where id='.$last_id);
		}
	}
	$groups=dbAll('select id,name from groups where site_id='.$site['id']);
	foreach ($groups as $group) {
		$kgs=dbAll('select id from keywords where group_id='.$group['id']);
		$keywords_in_group=[];
		foreach ($kgs as $kg) {
			$keywords_in_group[]=$kg['id'];
		}
		$keywords_in_group=join(', ', $keywords_in_group);
		$groupsql='';
		for ($i=$days;$i>1;--$i) {
			$sql='select avg(impressions) as impressions,avg(clicks) as clicks, avg(position) as position from data where data_type=0 and keyword_id in ('.$keywords_in_group.') and cdate=date_add(date(now()), interval -'.$i.' day)';
			$r=dbRow($sql);
			if ($r && $r['impressions']) {
				dbQuery('delete from data where data_type=2 and cdate=date_add(date(now()), interval -'.$i.' day) and site_id='.$site['id'].' and keyword_id='.$group['id']);
				$sql='insert into data set impressions='.$r['impressions'].', clicks='.$r['clicks'].', position='.$r['position'].', keyword_id='.$group['id'].', data_type=2, cdate=date_add(date(now()), interval -'.$i.' day), site_id='.$site['id'];
				dbQuery($sql);
				$last_id=dbLastInsertId();
				$sql='select sum(clicks) as clicks, sum(impressions) as impressions, avg(position) as position from data where data_type=0 and keyword_id in ('.$keywords_in_group.') and site_id='.$site['id'].' and cdate>=date_add(date_add(date(now()), interval -'.$i.' day), interval -28 day) and cdate<=date_add(date(now()), interval -'.$i.' day)';
				$sum=dbRow($sql);
				$importance=(1+$sum['clicks']/$sum['impressions'])*($sum['impressions']/$sum['position']);
				$sql2='update data set clicks28='.$sum['clicks'].', impressions28='.$sum['impressions'].', position28='.$sum['position'].', importance='.$importance.' where id='.$last_id;
				dbQuery($sql2);
				if ($group['id']=='5') {
					echo $sql."\n";
					echo json_encode($sum)."\n";
					echo $sql2."\n";
				}
				$groupsql='update groups set last_impression=date_add(date(now()), interval -'.$i.' day), clicks='.$sum['clicks'].', impressions='.$sum['impressions'].', position='.$sum['position'].', importance='.$importance.' where id='.$group['id'];
			}
		}
		if ($groupsql) {
			dbQuery($groupsql);
		}
	}
}
echo 'done';
