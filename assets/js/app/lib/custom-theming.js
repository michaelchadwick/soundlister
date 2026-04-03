/* custom theming functions */
/* global SoundLister */

// attempt to use custom settings if exist
SoundLister._setCustomTheme = async () => {
  try {
    const resp = await fetch('/custom.json')

    if (resp) {
      const conf = await resp.json()

      if (conf) {
        const icon = conf.faviconFilePath
        const header = conf.headerText
        const logo = conf.logoFilePath
        const title = conf.titleText

        if (icon !== '') {
          SoundLister._setCustomIcon(icon)
        }
        if (logo !== '') {
          SoundLister._setCustomLogo(logo)
        }
        if (header !== '') {
          SoundLister._setCustomHeader(header)
        }
        if (title !== '') {
          SoundLister._setCustomTitle(title)
        }
      } else {
        console.error('custom.json could not be loaded')
      }
    } else {
      // console.warn('custom.json not found');
    }
  } catch {
    // console.warn('no custom.json file found', e);
  }
}

SoundLister._setCustomIcon = (iconPath) => {
  var links = document.querySelectorAll("link[rel~='icon']")
  links.forEach((link) => {
    link.href = iconPath
  })
}
SoundLister._setCustomLogo = (logoPath) => {
  SoundLister.dom.logo.src = logoPath
}
SoundLister._setCustomHeader = (headerText) => {
  SoundLister.dom.headerText.innerHTML = headerText
}
SoundLister._setCustomTitle = (titleText) => {
  SoundLister.title = titleText
  SoundLister._setHtmlTitle()
}
