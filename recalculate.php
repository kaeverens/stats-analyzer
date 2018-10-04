<?php
require_once 'basics.php';

$sites=dbAll('select id,name from sites');
$days=25;


foreach ($sites as $site) {
	echo 'recalculating scores for '.$site['name']."\n";

	echo '  calculating keyword scores'."\n";
	$keywords=dbAll('select id,name,last_seen from keywords where site_id='.$site['id'].' and hide=0 and id>0');
	foreach ($keywords as $keyword) { // recalculate keywords
		echo '    recalculating values for keyword "'.$keyword['name']."\"\n";
		$dates=dbAll('select id,cdate from data where keyword_id='.$keyword['id'].' and cdate>date_add(now(), interval -7 day) order by cdate');
		$latest_date=$keyword['last_seen'];
		$importance=0;
		foreach ($dates as $date) {
			$sql='select sum(clicks) as clicks, sum(impressions) as impressions, avg(position) as position from data where keyword_id='.$keyword['id'].' and site_id='.$site['id'].' and cdate>=date_add("'.$date['cdate'].'", interval -28 day) and cdate<="'.$date['cdate'].'"';
			$sum=dbRow($sql);
			$latest_date=$date['cdate'];
			if (intval($sum['impressions'])) {
				$importance=(1+intval($sum['clicks'])/intval($sum['impressions']))*(intval($sum['impressions'])/floatval($sum['position']));
			}
			else {
				$importance=0;
			}
			dbQuery('update data set clicks28='.intval($sum['clicks']).', impressions28='.intval($sum['impressions']).', position28='.floatval($sum['position']).', importance='.$importance.' where id='.$date['id']);
		}
		dbQuery('update keywords set last_seen="'.$latest_date.'", importance='.$importance.' where id='.$keyword['id']);
	}
	for ($i=$days;$i>1;--$i) {
		continue;
		/*
		$sql='select avg(impressions) as impressions,avg(clicks) as clicks, avg(position) as position from data left join keywords on keyword_id=keywords.id where cdate=date_add(date(now()), interval -'.$i.' day) and hide=0 and data.data_type=0 and data.site_id='.$site['id'];
		$r=dbRow($sql);
		if ($r && $r['impressions']) {
			dbQuery('delete from data where data_type=1 and cdate=date_add(date(now()), interval -'.$i.' day) and site_id='.$site['id']);
			$sql='insert into data set impressions='.$r['impressions'].', clicks='.$r['clicks'].', position='.$r['position'].', keyword_id=0, data_type=1, cdate=date_add(date(now()), interval -'.$i.' day), site_id='.$site['id'];
			dbQuery($sql);
			$last_id=dbLastInsertId();
			$sql='select sum(clicks) as clicks, sum(impressions) as impressions, avg(position) as position from data where data_type=1 and keyword_id=0 and site_id='.$site['id'].' and cdate>=date_add(date_add(date(now()), interval -'.$i.' day), interval -28 day) and cdate<date_add(date(now()), interval -'.$i.' day)';
			$sum=dbRow($sql);
			if ($sum['impressions']==0 || $sum['position']==0) {
				$importance=0;
				dbQuery('delete from data where id='.$last_id);
			}
			else {
				$importance=(1+$sum['clicks']/$sum['impressions'])*($sum['impressions']/$sum['position']);
				dbQuery('update data set clicks28='.$sum['clicks'].', impressions28='.$sum['impressions'].', position28='.$sum['position'].', importance='.$importance.' where id='.$last_id);
			}
		}
		*/
	}

	echo '  calculating group scores'."\n";
	$groups=dbAll('select id,name from groups where site_id='.$site['id']);
	foreach ($groups as $group) {
		echo '    recalculating values for group "'.$group['name']."\"\n";
		$kgs=dbAll('select id from keywords where group_id='.$group['id'].' and hide=0');
		$keywords_in_group=[];
		foreach ($kgs as $kg) {
			$keywords_in_group[]=$kg['id'];
		}
		$groupsql='';
		if (count($keywords_in_group)) {
			$keywords_in_group=join(', ', $keywords_in_group);
			for ($i=$days;$i>1;--$i) {
				$sql='select avg(impressions) as impressions, (sum(impressions*clicks)/sum(impressions)) as clicks, (sum(impressions*position)/sum(impressions)) as position from data where data_type=0 and keyword_id in ('.$keywords_in_group.') and cdate=date_add(date(now()), interval -'.$i.' day) and impressions';
				$r=dbRow($sql);
				if ($r && $r['impressions']) {
					dbQuery('delete from data where data_type=2 and cdate=date_add(date(now()), interval -'.$i.' day) and site_id='.$site['id'].' and keyword_id='.$group['id']);
					$sql='insert into data set impressions='.$r['impressions'].', clicks='.$r['clicks'].', position='.$r['position'].', keyword_id='.$group['id'].', data_type=2, cdate=date_add(date(now()), interval -'.$i.' day), site_id='.$site['id'];
					dbQuery($sql);
					$last_id=dbLastInsertId();
					$sql='select sum(clicks) as clicks, sum(impressions) as impressions, (sum(impressions*position)/sum(impressions)) as position from data where data_type=0 and keyword_id in ('.$keywords_in_group.') and site_id='.$site['id'].' and cdate>=date_add(date_add(date(now()), interval -'.$i.' day), interval -28 day) and cdate<=date_add(date(now()), interval -'.$i.' day)';
					$sum=dbRow($sql);
					$sum['impressions']=intval($sum['impressions']);
					$sum['clicks']=intval($sum['clicks']);
					$sum['position']=floatval($sum['position']);
					if ($sum['impressions']==0 || $sum['position']==0) {
						$importance=0;
						dbQuery('delete from data where id='.$last_id);
					}
					else {
						$importance=(1+$sum['clicks']/$sum['impressions'])*($sum['impressions']/$sum['position']);
						$sql2='update data set clicks28='.$sum['clicks'].', impressions28='.$sum['impressions'].', position28='.$sum['position'].', importance='.$importance.' where id='.$last_id;
						dbQuery($sql2);
					}
					$groupsql='update groups set last_impression=date_add(date(now()), interval -'.$i.' day), clicks='.$sum['clicks'].', impressions='.$sum['impressions'].', position='.$sum['position'].', importance='.$importance.' where id='.$group['id'];
				}
			}
		}
		if ($groupsql) {
			dbQuery($groupsql);
		}
	}
}
echo 'done';
