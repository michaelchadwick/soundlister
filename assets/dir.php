<?php

  $titles = array();

  foreach (glob('audio/*/*.{aac,flac,m4a,mp3,mp4,ogg,wav,webm}', GLOB_BRACE) as $filename) {
    $path = pathinfo($filename);
    $titles[] = $path;
  }

  if (sizeof($titles)) {
    // No support for M3U yet :'(
    //
    // if (!file_exists('audio/playlist.m3u')) {
    //   try {
    //     $fp = fopen('audio/playlist.m3u', 'w');

    //     foreach ($titles as $title) {
    //       fwrite($fp, $title . "\n");
    //     }
    //   } catch (Exception $e) {
    //     echo 'Could not open playlist file: ' . $e->getMessage() . "\n";
    //   }
    // }

    echo json_encode($titles);
  } else {
    throw new Exception("Could not get song titles");
  }

?>