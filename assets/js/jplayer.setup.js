$(function () {
  fetch('./assets/dir.php').then((response) => {
    if (response.status >= 200 && response.status < 300) {
      return response.text();
    } else {
      throw new Error(response.statusText);
    }
  }).then((data) => {
    let dir = 'assets/audio';
    let files = JSON.parse(data);
    let filesObjArr = []

    files.forEach(f => {
      let t = f.replaceAll('-', ' ').replaceAll(/[0-9]/g, '')
      let t_split = t.split(' ')

      for (var i = 0; i < t_split.length; i++) {
        t_split[i] = t_split[i].charAt(0).toUpperCase() + t_split[i].slice(1);
      }

      t = t_split.join(' ')

      filesObjArr.push({
        title: t,
        mp3: `${dir}/${f}.mp3`,
        oga: `${dir}/${f}.ogg`,
        free: true
      });
    });

    new jPlayerPlaylist({
      jPlayer: '#jquery_jplayer_1',
      cssSelectorAncestor: '#jp_container_1'
    },
    filesObjArr,
    {
      swfPath: 'vendor/jquery.jplayer.swf',
      supplied: 'mp3, oga',
      wmode: 'window',
      volume: 0.75
    })
  })
})
