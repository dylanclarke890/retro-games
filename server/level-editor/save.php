<?php
declare(strict_types=1);
require_once("../config.php");

$path = $_GET["path"];
$data = file_get_contents("php://input");

if (empty($path) || empty($data))
  exit_with_err(1, "No data or path specified. Received path - $path and data - $data.");

$path = $file_root . str_replace('..', '', $path);
if (!preg_match('/\.js$/', $path))
  exit_with_err(2, "File must have a .js suffix.");

$success = file_put_contents($path, $data);
if ($success === false) exit_with_err(3, "Couldn't write to file: $path");

echo json_encode(array("error" => 0));
