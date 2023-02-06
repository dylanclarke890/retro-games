<?php

declare(strict_types=1);
require_once("../config.php");

$dir_val = $_GET["dir"];
$dir = $file_root . str_replace('..', '', $dir_val);
if ($dir[strlen($dir) - 1] !== '/') $dir .= '/';

$find;
switch ($_GET['type']) {
  case 'images':
    $find = '*.{png,gif,jpg,jpeg}';
    break;
  case 'scripts':
    $find = '*.js';
    break;
  default:
    $find = '*.*';  
    break;
}

$dirs = glob($dir . '*', GLOB_ONLYDIR) ?? array();
foreach ($dirs as $i => $d) $dirs[$i] = substr($d, $file_root_len);
$files = glob($dir . $find, GLOB_BRACE) ?? array();
foreach ($files as $i => $f) $files[$i] = substr($f, $file_root_len);


$parent = false;
if ($dir !== $file_root && dirname($dir) !== $file_root) $parent = substr(dirname($dir), $file_root_len);

echo json_encode(array('parent' => $parent, 'dirs' => $dirs, 'files' => $files));
