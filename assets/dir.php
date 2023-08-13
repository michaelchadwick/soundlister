<?php

  $files = array();
  $audio_root = 'audio2/';
  $dir = '';

  foreach (glob($audio_root . '*/*.{aac,flac,m4a,mp3,mp4,ogg,wav,webm}', GLOB_BRACE) as $filename) {
    $path = pathinfo($filename);

    if ($dir != $path['dirname']) {
      $dir = $path['dirname'];
      $dirIndex = explode('/', $path['dirname'])[1];
      $files[$dirIndex] = [];
    }

    $fullpath = $path['dirname'] . '/' . $path['basename'];

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

  function getDisplayDuration($ms) {
    $seconds = intdiv($ms, 1000);
    $secs = $seconds;

    // length at least > 0
    if ($seconds > 0) {
      // echo "song is not empty";

      // length at least > 1:00
      if ($seconds > 60) {
        // echo "song is at least a minute long";

        // length at least > 1:00:00
        if (intdiv($seconds, 60) > 60) {
          echo "song is at least an hour long!";

          $hours = intdiv(intdiv($seconds, 60), 60);

          if ($hours < 10) {
            $hours = '0' . $hours;
          }
        } else {
          $hours = '00';
        }

        if ($seconds % 60 > 0) {
          $mins = floor($seconds / 60);
          $secs = $seconds % 60;
        }

        if ($mins < 10) {
          $mins = '0' . $mins;
        }
      } else {
        $mins = '0';
      }

      if ($secs < 10) {
        $secs = '0' . $secs;
      }
    } else {
      $secs = '00';
    }

    $time_format = "$mins:$secs";

    return $time_format;
  }

?>
