<?php

declare(strict_types=1);
define("ENTITY_REGEX", '/(?<=Register.entityType\()[^)]+|(?<=Register.entityTypes\()[^)]+/');

function get_entities_from_glob(string $glob): array
{
  if (!$glob) die("Invalid glob provided: " . $glob);
  $filepaths = glob(dirname(__FILE__, 3) . $glob);
  if ($filepaths === false) die("Invalid glob provided: " . $glob);

  $entityList = array();
  foreach ($filepaths as $path) {
    $file = fopen($path, "r") or die("Error opening file: " . $path);
    $res = preg_match_all(constant("ENTITY_REGEX"), fread($file, filesize($path)), $matches_found);
    if ($res === 0 || $res === false) {
      fclose(($file));
      continue;
    }

    $entities_for_file = array();
    $flattened_matches = array_merge(...$matches_found);
    foreach ($flattened_matches as $match)
      $entities_for_file = array_merge($entities_for_file, preg_split("/[\s,]+/", $match));
    $entityList[$path] = $entities_for_file;
    fclose($file);
  }

  echo json_encode($entityList);
  return $entityList;
}

$entity_file_globs = array("/src/entities/*.js");

foreach ($entity_file_globs as $glob) {
  get_entities_from_glob($glob);
}
