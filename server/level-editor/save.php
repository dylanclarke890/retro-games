<?php

declare(strict_types=1);
$file_root = dirname(__FILE__, 3);
$file_root_len = strlen($file_root);
$result = array('error' => 0);
if (!empty($_POST['path']) && !empty($_POST['data'])) {
  $path = $file_root . str_replace('..', '', $_POST['path']);

  if (preg_match('/\.js$/', $path)) {
    $success = file_put_contents($path, $_POST['data']);
    if ($success === false) {
      $result = array(
        'error' => '2',
        'msg' => "Couldn't write to file: $path"
      );
    }
  } else {
    $result = array(
      'error' => '3',
      'msg' => "File must have a .js suffix"
    );
  }
} else {
  $result = array(
    'error' => '1',
    'msg' => "No Data or Path specified"
  );
}

echo json_encode($result);

?>