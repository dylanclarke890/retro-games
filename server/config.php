<?php

declare(strict_types=1);

$file_root = dirname(__FILE__, 2) . "/";
$file_root_len = strlen($file_root);

function exit_with_err($code, $message)
{
  echo json_encode(array('error' => $code, 'msg' => $message));
  exit;
}