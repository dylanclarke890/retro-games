<?php
declare(strict_types=1);
require_once("../config.php");

if (empty($_POST['path']) || empty($_POST['data']))
  exit_with_err(1, "No Data or Path specified.");

$path = $file_root . str_replace('..', '', $_POST['path']);
if (!preg_match('/\.js$/', $path))
  exit_with_err(2, "File must have a .js suffix.");

$success = file_put_contents($path, $_POST['data']);
if ($success === false) exit_with_err(3, "Couldn't write to file: $path");

echo json_encode(array("error" => 0));
