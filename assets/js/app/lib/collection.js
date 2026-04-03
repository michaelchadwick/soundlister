/* collection handling functions */
/* global SoundLister, SL_DEFAULT_COLLECTION */

// update collection dropdown based on values in the query string
SoundLister._loadQSCollection = () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  })

  const colToLoad = params.col || params.coll || params.collection

  if (colToLoad) {
    SoundLister.coll = colToLoad

    const validChoices = Array.from(SoundLister.dom.collDropdown.options).map((op) => op.value)

    // permananently change to one collection (save network)
    // remove collection dropdown
    if (validChoices.includes(colToLoad)) {
      SoundLister._removeCollDropdown(colToLoad)
    } else {
      // if invalid collection speficied, default to all collections
      SoundLister.coll = SL_DEFAULT_COLLECTION
    }
  }
}

// add new option to collections dropdown
SoundLister._addCollectionOption = (col) => {
  // bog-standard <select>
  SoundLister.dom.collDropdown.options.add(new Option(col, col))

  // STUB
  // Blog: https://css-tricks.com/striking-a-balance-between-native-and-custom-select-elements/
  // Codepen: https://codepen.io/sandrina-p/pen/YzyOYRr

  // SoundLister.dom.collNative.options.add(new Option(col, col))

  // const option = document.createElement('div')
  // option.classList.add('selectCustom-option')
  // option.dataset.value = col
  // option.textContent = col
  // SoundLister.dom.collCustom.querySelector('.selectCustom-options').appendChild(option)
}

// update <title> with chosen collection name
SoundLister._updateCollDisplay = (overridedTitle = null) => {
  if (overridedTitle) {
    SoundLister.coll = overridedTitle
  }

  SoundLister._setHtmlTitle()
}

// remove the collection dropdown if there is only one collection
SoundLister._removeCollDropdown = (collection) => {
  SoundLister.dom.collDropdown.value = collection
  SoundLister.dom.collDropdown.dispatchEvent(new Event('change'))
  SoundLister.dom.collDropdown.disabled = true
  SoundLister.dom.collDropdown.style.display = 'none'

  if (collection && collection !== SL_DEFAULT_COLLECTION) {
    SoundLister._updateCollDisplay()
  }
}

// update query string based on changes to the current collection filter
SoundLister._updateQueryString = (coll) => {
  const url = new URL(location)
  url.searchParams.set('coll', coll)
  window.history.pushState({}, '', url)
}
