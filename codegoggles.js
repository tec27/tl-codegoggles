/*jshint asi:true laxcomma:true browser:true jquery:true */
/*global console:true ace:true hljs:true */

;(function(rootPath) {
"use strict";

// map of hljs language names to Ace Editor modes, anything missing is the same
var hljsToAceMode = 
  { bash: 'sh'
  , coffeescript: 'coffee'
  , cpp: 'c_cpp'
  , cs: 'csharp'
  , delphi: 'pascal'
  , go: 'golang' 
  }

function loadScript(url, cb) {
  var script = document.createElement('script')
  script.type = 'text/javascript'
  script.addEventListener('load', cb)
  script.src = url
  document.head.appendChild(script)
}

// pull in ACE
loadScript(rootPath + 'ace/ace.js', init)

function init() {
  if(!window.$ || !window.ace) {
    return setTimeout(init, 16)
  }

  Array.prototype.forEach.call($('td.forumPost pre'), function(codeElem) {
    var $codeElem = $(codeElem)
    // try to get the font as close to ACE's as possible, so the height of the resulting editor
    // doesn't cause a need for scrolling
    $codeElem.css({ fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Droid Sans Mono', " +
                    "'Consolas', monospace"
                  , fontSize: '12px'
                  , visibility: 'hidden'
                  })

    var codeStr = $codeElem.html().replace(/<br>/g, '\n')
      , editorElem = $('<div/>',
          { css:
            { width: $codeElem.outerWidth()
            , height: $codeElem.outerHeight() + 16
            , position: 'relative'
            , left: '5px'
            , marginBottom: '6px'
            }
          , html: codeStr
          })


    $codeElem.replaceWith(editorElem)
    var editor = ace.edit(editorElem[0])
    editor.setTheme('ace/theme/tomorrow_night')
    editor.setReadOnly(true)

    setTimeout(function() {
      var hlResult = hljs.highlightAuto(codeStr)
        , language = hlResult.language
      if(hljsToAceMode.hasOwnProperty(language)) {
        language = hljsToAceMode[language]
      }
      editor.getSession().setMode('ace/mode/' + language)
    }, 0)
  })
}

})(window.TL_CODEGOGGLES_ROOT);
