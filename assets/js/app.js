// SoundLister object init
if (typeof SoundLister === 'undefined') var SoundLister = {};

const SOUNDLISTER_ENV_PROD_URL = [
  'sl.neb.host',
  'soundlister.neb.host',
  'satch20.nebyoolae.com',
  'bits.neb.host',
];

SoundLister.env = SOUNDLISTER_ENV_PROD_URL.includes(document.location.hostname) ? 'prod' : 'local';

SoundLister._logStatus = (msg, arg = null) => {
  if (SoundLister.env == 'local') {
    if (arg) {
      console.log(msg, arg);
    } else {
      console.log(msg);
    }
  }
};

SoundLister._logStatus('[LOADED] /SoundLister');
