<?php

  $out = array();
  foreach (glob('audio/*.mp3') as $filename) {
    $p = pathinfo($filename);
    $out[] = $p['filename'];
  }
  echo json_encode($out);

?>