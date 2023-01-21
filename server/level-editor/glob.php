<?php

declare(strict_types=1);
require_once("../config.php");
define("ENTITY_REGEX", '/(?<=Register.entityType\()[^)]+|(?<=Register.entityTypes\()[^)]+/');

function get_entities_from_glob(string $glob): array
{
  if (empty($glob)) exit_with_err(1, "Invalid glob provided: " . $glob);
  if ($glob[0] !== "/") $glob = "/" . $glob;

  global $file_root;
  global $file_root_len;
  $filepaths = glob($file_root . $glob);
  if ($filepaths === false) exit_with_err(3, "Invalid glob provided: " . $glob);

  $entities_found = array();
  foreach ($filepaths as $current_path) {
    $file = fopen($current_path, "r") or die("Error opening file: " . $current_path);
    $res = preg_match_all(constant("ENTITY_REGEX"), fread($file, filesize($current_path)), $matches_found);
    fclose(($file));

    if ($res === 0 || $res === false) continue;
    $entities_for_file = array();
    $flattened_matches = array_merge(...$matches_found);
    foreach ($flattened_matches as $match)
      $entities_for_file = array_merge($entities_for_file, preg_split("/[\s,]+/", $match));
    $entities_found[substr($current_path, $file_root_len)] = $entities_for_file;
  }

  return $entities_found;
}

$entity_file_globs = $_GET["entity_filepaths"];
if (empty($entity_file_globs)) exit_with_err(2, "Entity filepaths are required.");
$entity_file_globs = json_decode($entity_file_globs);

$all_entities_found = array();
foreach ($entity_file_globs as $glob)
  $all_entities_found = array_merge($all_entities_found, get_entities_from_glob($glob));

echo json_encode($all_entities_found);
