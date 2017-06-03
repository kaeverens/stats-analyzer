<?php
require_once 'basics.php';
$id=intval($_REQUEST['id']);
$hide=intval($_REQUEST['hide']);
dbQuery('update keywords set hide='.$hide.' where id='.$id);
echo 'ok';
