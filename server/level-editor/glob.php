<?php

declare(strict_types=1);

function get_entities(string $glob): array
{
  $entityList = array();
  $filepaths = glob(dirname(__FILE__, 3) . $glob);
  foreach ($filepaths as $path) {
    $file = fopen($path, "r") or die("Unable to open file!");
    $contents = fread($file, filesize($path));
    $res = preg_match_all('/(?<=Register.entityType\()[^)]+|(?<=Register.entityTypes\()[^)]+/', $contents, $output_array);
    echo json_encode($output_array);
    // if ($res > 0) {
    //   $files = array_merge($entityList, array_ $output_array);
    // }
    fclose($file);
  }
  return $entityList;
}

// echo json_encode($output_array);

$entity_file_globs = array("/src/entities/*.js", "/src/entities/*.js");

get_entities($entity_file_globs[0]);

// foreach ($entity_file_globs as $glob) {
//   getEntities($glob);
// }
// echo json_encode($filepaths);
