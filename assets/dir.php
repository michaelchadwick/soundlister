<?php

  $out = array();

  foreach (glob('audio/*.{aac,flac,m4a,mp3,mp4,ogg,wav,webm}', GLOB_BRACE) as $filename) {
    $p = pathinfo($filename);
    $out[] = $p['basename'];
  }

  echo json_encode($out);

?>