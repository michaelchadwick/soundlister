<?php

  $files = array();
  $dir = '';

  foreach (glob('audio/*/*.{aac,flac,m4a,mp3,mp4,ogg,wav,webm}', GLOB_BRACE) as $filename) {
    $path = pathinfo($filename);

    if ($dir != $path['dirname']) {
      $dir = $path['dirname'];
      $dirIndex = explode('/', $path['dirname'])[1];
      $files[$dirIndex] = [];
    }

    $files[$dirIndex][] = $path;
  }

  if (sizeof($files)) {
    echo json_encode($files);
  } else {
    throw new Exception("Could not get song titles");
  }

?>