<?php

declare(strict_types=1);
$file_root = dirname(__FILE__, 3);
$file_root_len = strlen($file_root);

function exit_with_err($code, $message)
{
  echo json_encode(array('error' => $code, 'msg' => $message));
  exit;
}

if (empty($_POST['path']) || empty($_POST['data']))
  exit_with_err(1, "No Data or Path specified.");

$path = $file_root . str_replace('..', '', $_POST['path']);
if (!preg_match('/\.js$/', $path))
  exit_with_err(2, "File must have a .js suffix.");

$success = file_put_contents($path, $_POST['data']);
if ($success === false) exit_with_err(3, "Couldn't write to file: $path");

echo json_encode(array("error" => 0));
