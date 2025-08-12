<?php

  $files = array();
  $dir = '';
  $audio_root = 'audio/';
  $exts = ['aac', 'flac', 'm4a', 'mp3', 'mp4', 'ogg', 'wav', 'webm'];

  $iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($audio_root, FilesystemIterator::SKIP_DOTS)
  );

  foreach ($iterator as $file) {
    if (in_array(strtolower($file->getExtension()), $exts)) {
      // echo $file->getPathname(), PHP_EOL; // audio/[subdir/]music.mp3
      // echo $file->getFileInfo(), PHP_EOL; // audio/[subdir/]music.mp3
      // echo $file->getBasename(), PHP_EOL; // music.mp3
      // echo $file->getFilename(), PHP_EOL; // music.mp3
      // echo $file->getPath(), PHP_EOL;     // audio/[subdir/]
      // echo PHP_EOL;

      $pathArr = explode('/', $file->getPath());
      $lastSubdir = end($pathArr);

      if ($dir != $lastSubdir) {
        $dir = $lastSubdir;
        $dirIndex = $lastSubdir;
        $files[$dirIndex] = [];
      }

      $fullpath = $file->getPath() . '/' . $file->getBasename();
      $total_ms = getFileLengthInMs($fullpath);

      $path['basename'] = $file->getBasename();
      $path['duration'] = getDisplayDuration($total_ms);
      $path['extension'] = $file->getExtension();
      $path['filename'] = $file->getFilename();
      $path['ms'] = $total_ms;
      $path['subdirPath'] = explode('/', $file->getPath())[1];
      $path['updated'] = getFileUpdatedDate($fullpath);

      $files[$dirIndex][] = $path;
    }
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
