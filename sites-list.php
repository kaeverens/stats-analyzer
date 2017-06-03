<?php
require_once 'basics.php';
header('Content-type: text/json');
echo json_encode(dbAll('select * from sites'));
