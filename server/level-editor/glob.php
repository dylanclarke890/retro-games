<?php

declare(strict_types=1);
define("ENTITY_REGEX", '/(?<=Register.entityType\()[^)]+|(?<=Register.entityTypes\()[^)]+/');
$file_root = dirname(__FILE__, 3);

function get_entities_from_glob(string $glob): array
{
  if (!$glob) die("Invalid glob provided: " . $glob);
  global $file_root;
  $filepaths = glob($file_root . $glob);
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

  return $entityList;
}

$entity_file_globs = array("/src/entities/pong-entities.js", "/src/entities/fix-entities.js");

$all_entities_found = array();
foreach ($entity_file_globs as $glob)
  $all_entities_found = array_merge($all_entities_found, get_entities_from_glob($glob));

echo json_encode($all_entities_found);
