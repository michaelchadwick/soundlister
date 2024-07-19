<?php

  $files = array();
  $audio_root = 'audio/';
  $dir = '';

  foreach (glob($audio_root . '*/*.{aac,flac,m4a,mp3,mp4,ogg,wav,webm}', GLOB_BRACE) as $filename) {
    $path = pathinfo($filename);

    if ($dir != $path['dirname']) {
      $dir = $path['dirname'];
      $dirIndex = explode('/', $path['dirname'])[1];
      $files[$dirIndex] = [];
    }

    $fullpath = $path['dirname'] . '/' . $path['basename'];

    $path['updated'] = getFileUpdatedDate($fullpath);

    $total_ms = getFileLengthInMs($fullpath);

    $path['ms'] = $total_ms;
    $path['duration'] = getDisplayDuration($total_ms);

    $files[$dirIndex][] = $path;
  }

  if (sizeof($files)) {
    echo json_encode($files);
  } else {
    echo json_encode([]);
  }

  function getFileLengthInMs($path) {
    $cmd = "mediainfo --Output='General;%Duration%' " . escapeshellarg($path);

    return intval(exec($cmd));
  }

  function getFileUpdatedDate($path) {
    $cmd = "date -r " . escapeshellarg($path);

    return exec($cmd);
  }

  function getDisplayDuration($ms) {
    $ts = intdiv($ms, 1000);
    $s = $ts % 60;
    $m = intdiv($ts, 60) % 60;
    $h = intdiv($ts, 3600);

    $time_format = "$m:$s";

    if ($h > 0) {
      if ($m < 10) $m = '0' . $m;
      if ($s < 10) $s = '0' . $s;

      $time_format = "$h:$m:$s";
    } else {
      if ($s < 10) $s = '0' . $s;

      $time_format = "$m:$s";
    }

    return $time_format;
  }
?>
