/*jshint asi:true laxcomma:true browser:true */
/*global console:true localStorage:true chrome:true */

// this script gets injected on every teamliquid page, regardless of the extension settings
// as such, the code in this script should be as minimal as possible -- that is, simply check the
// settings, inject heavier scripts if necessary, and get out of the way
;(function() {
"use strict";

var curPath = document.location.pathname
  , settings = JSON.parse(localStorage.getItem('cg') || '{}')
  , useOnAllPages = !!settings.useOnAllPages
  , enabledPages = settings.enabledPages || []

if(!settings.setup) {
  enabledPages =  [ '134491'
                  ]
}

if(useOnAllPages) {
  return inject()
}

var isEnabled = (curPath == '/forum/viewmessage.php' || curPath == '/forum/postmessage.php')
if(!isEnabled) {
  return;
}

var querySplit = document.location.search.substring(1).split('&')
  , curQuery = querySplit.reduce(function(queryObj, elem) {
  if(!elem.length) {
    return
  }

  var split = elem.split('=')
    , name = decodeURIComponent(split[0])
    , value = split.length > 1 ? decodeURIComponent(split[1]) : null

  // make sure we don't clobber native properties with query string values
  if(!name.length || Object.prototype.hasOwnProperty(name)) {
    name = '_' + name
  }
  
  if(typeof queryObj[name] != 'undefined') {
    if(Object.prototype.toString.call(queryObj[name]) != '[object Array]') {
      queryObj[name] = [ queryObj[name] ]
    }

    queryObj[name].push(value)
  }
  else {
    queryObj[name] = value
  }

  return queryObj
}, {})

isEnabled = enabledPages.some(function(topicId) {
  return curQuery.topic_id == topicId
})
if(isEnabled) {
  return inject()
}

function inject() {
  if(!document.head) {
    return setTimeout(inject, 16)
  }

  var scripts = [ 'highlight.pack.js'
                , 'codegoggles.js'
                ]
    , styles =  [ 'codegoggles.css'
                ]

  styles.forEach(function(styleName) {
    var styleUrl = chrome.extension.getURL(styleName)
      , styleElem = document.createElement('link')

    styleElem.rel = 'stylesheet'
    styleElem.type = 'text/css'
    styleElem.href = styleUrl
    document.head.appendChild(styleElem)
  })

  // inject a JS var to be used by injected scripts that gives their root directory
  var rootVarElem = document.createElement('script')
  rootVarElem.type = 'text/javascript'
  rootVarElem.innerHTML = 'window.TL_CODEGOGGLES_ROOT = "' + chrome.extension.getURL('') + '"'
  document.head.appendChild(rootVarElem)

  scripts.forEach(function(scriptName) {
    var scriptUrl = chrome.extension.getURL(scriptName)
      , scriptElem = document.createElement('script')

    scriptElem.type = 'text/javascript'
    scriptElem.src = scriptUrl
    document.head.appendChild(scriptElem)
  })

  // Add an event handler for loading extension scripts into Blobs (used for Workers in ACE)
  document.addEventListener('TLCG_loadScript', function(e) {
    var scriptRequest = new XMLHttpRequest()
    scriptRequest.onload = function() {
      var response = new CustomEvent('TLCG_loaded',
          { bubbles: false
          , detail: { script: this.responseText }
          })
      e.target.dispatchEvent(response)
    }
    scriptRequest.onerror = function() {
      throw new Error('Error loading ' + e.detail.url)
    }

    scriptRequest.open('get', e.detail.url, true)
    scriptRequest.send()
  })
}

})();
