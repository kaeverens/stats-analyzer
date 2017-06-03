<?php
require_once 'basics.php';

$site_id=intval($_REQUEST['site_id']);
$sql='select id,hide,name,last_seen,importance,(select clicks28 from data where keyword_id=keywords.id and cdate=last_seen) as clicks28,(select impressions28 from data where keyword_id=keywords.id and cdate=last_seen) as impressions28, (select position28 from data where keyword_id=keywords.id and cdate=last_seen) as position28 from keywords where site_id='.$site_id.' and last_seen>date_add(now(), interval -28 day) order by importance desc';
$stats=dbAll($sql);
header('Content-type: text/json');
echo json_encode($stats);
