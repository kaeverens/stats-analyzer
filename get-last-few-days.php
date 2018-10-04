<?php
require_once 'basics.php';

$sites=dbAll('select * from sites');
foreach ($sites as $site_data) {
	$site_id=$site_data['id'];
	// { set up the client
	putenv('GOOGLE_APPLICATION_CREDENTIALS='.__DIR__.'/'.$site_data['google_credentials']);
	echo 'GOOGLE_APPLICATION_CREDENTIALS='.__DIR__.'/'.$site_data['google_credentials']."\n";
	$client = new Google_Client();
	$client->useApplicationDefaultCredentials();
	$client->setScopes([Google_Service_Webmasters::WEBMASTERS_READONLY]);
	$service = new Google_Service_Webmasters($client);
	$request = new Google_Service_Webmasters_SearchAnalyticsQueryRequest();
	$request->setRowLimit(5000);
	$request->setSearchType('web');
	$request->setDimensions(['query']);
	// }
	for ($i=7; $i>2; --$i) {
		$date=date('Y-m-d', time()-3600*24*$i);
		echo $date;
		$request->setStartDate($date);
		$request->setEndDate($date);
		$result=$service->searchanalytics->query($site_data['name'], $request);
		$data=[];
		$rows=json_decode(json_encode($result->rows), true);
		dbQuery('delete from data where site_id='.$site_id.' and cdate="'.$date.'"');
		foreach ($rows as $row) {
			$data=[
				$row['keys'][0],
				$row['clicks'],
				$row['impressions'],
				$row['ctr'],
				$row['position']
			];
			$keyword=dbRow('select * from keywords where site_id='.$site_id.' and name="'.addslashes($data[0]).'"');
			if (!$keyword) {
				dbQuery('insert into keywords set site_id='.$site_id.', name="'.addslashes($data[0]).'"');
				$keyword=dbRow('select * from keywords where site_id='.$site_id.' and name="'.addslashes($data[0]).'"');
			}
			$sql='insert into data set cdate="'.$date.'", site_id='.$site_id.', keyword_id='.$keyword['id'].', clicks='.$data[1].', impressions='.$data[2].', position='.$data[4];
			echo $sql."\n";
			dbQuery($sql);
			$id=dbLastInsertId();
			$sum=dbRow('select sum(clicks) as clicks, sum(impressions) as impressions, avg(position) as position from data where keyword_id='.$keyword['id'].' and site_id='.$site_id.' and cdate>=date_add("'.$date.'", interval -28 day) and cdate<="'.$date.'"');
			$importance=(1+$sum['clicks']/$sum['impressions'])*($sum['impressions']/$sum['position']);
			dbQuery('update data set clicks28='.$sum['clicks'].', impressions28='.$sum['impressions'].', position28='.$sum['position'].', importance='.$importance.' where id='.$id);
			$hasNewer=dbOne('select id from data where keyword_id='.$keyword['id'].' and cdate>"'.$date.'"', 'id');
			if (!$hasNewer) {
				dbQuery('update keywords set last_seen="'.$date.'", importance='.$importance.' where id='.$keyword['id']);
			}
		}
		sleep(1);
	}
}

require_once 'recalculate.php';
