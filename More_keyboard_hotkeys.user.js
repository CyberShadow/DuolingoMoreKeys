// ==UserScript==
// @name        More Duolingo keyboard hotkeys
// @description Makes all Duolingo exercises accessible with the keyboard
// @namespace   thecybershadow.net
// @author      Vladimir Panteleev <https://thecybershadow.net/>
// @include     https://www.duolingo.com/*
// @include     https://preview.duolingo.com/*
// @version     10
// @grant       none
// @run-at      document-start
// ==/UserScript==

(function () {
  // Configuration
  var keys = window.localStorage.duolingoMoreKeysLayout || '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var listenKey = window.localStorage.duolingoMoreKeysListenKey || JSON.stringify([' ', false, true, false, false]);
  var listenSlowlyKey = window.localStorage.duolingoMoreKeysListenSlowlyKey || JSON.stringify([' ', true, true, false, false]);

  // React/Duolingo obfuscated class names
  var classNameButton   = '_1O290'; // Button representing a word or letter
  var classNameDisabled = '_2mDNn'; // Additional button class for used words
  var classNameExercise = '_32AJE'; // Div enclosing all controls of an exercise
  var classNameListen   = '_1x6bc'; // Button which replays the exercise's audio

  // React reimplements console.log, so save a
  // private reference to the original on load
  var realConsole = console;
  var realConsoleLog = console.log;
  function log(s) {
    realConsoleLog.call(realConsole, s);
  }

  // Styling for the hotkey bubbles
  function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
  }

  document.addEventListener("DOMContentLoaded", function(event) {
    addGlobalStyle(
      '.key-hint { '+
      '  position: absolute;'+
      '  left: -10px;'+
      '  top: -10px;'+

    //'  color: #777;'+
    //'  background-color: #fff;'+
    //'  border: 2px solid #dadada; '+
      '  color: white;'+
      '  background-color: #aaa;'+
      '  border: 1.5px solid #aaa;'+

      '  width: 20px;'+
      '  height: 20px;'+
      '  font-size: 12px;'+
      '  font-weight: 700;'+
      '  line-height: 14px;'+
      '  text-align: center;'+
      '  border-radius: 12px;'+
      '  padding: 2px;'+
      '}' +
      '' +
      '.'+classNameDisabled+' .key-hint,'+
      'button:disabled .key-hint {' +
      '  display: none;' +
      '}'
    );
  });

  // Current key->button mapping
  var currentButtons = {};

  function checkDom() {
    try {
      if (document.getElementsByClassName(classNameExercise).length != 1)
        return; // No exercise active (<1), or during transition animation between two exercises (>1)

      var buttons = document.getElementsByClassName(classNameButton);
      buttons = Array.prototype.slice.call(buttons);
      //log('Found ' + buttons.length + ' buttons');

      if (!document.querySelector('div.key-hint')) {
        // New exercise

        currentButtons = {};

        var bi = 0;
        for (var i = 0; i < buttons.length; i++) {
          var b = buttons[i];
          if (b.classList.contains(classNameDisabled))
            continue; // shouldn't happen with a fresh layout, but the script may have just been loaded

          var key = keys[bi];
          currentButtons[key] = b;
          var div = b.querySelector('div.key-hint');
          if (!div) {
            div = document.createElement('div');
            div.classList.add('key-hint');
            b.insertBefore(div, b.firstChild);
          }
          div.textContent = key;
          bi++;
        }
      } else {
        // Update layout for the same exercise

        // Keep the same keys for used words
        // (when translating sentences to the target language).
        // Since Duolingo recreates the HTML nodes, we have to infer
        // what their initially assigned hotkey was by the node's text.
        var usedWords = {};

        for (var i = 0; i < buttons.length; i++) {
          var b = buttons[i];
          if (b.classList.contains(classNameDisabled) && b.querySelector('div.key-hint')) {
            var text = b.childNodes[1].textContent;
            var key = b.childNodes[0].textContent;
            usedWords[text] = key;
          }
        }

        for (var i = 0; i < buttons.length; i++) {
          var b = buttons[i];
          if (b.classList.contains(classNameDisabled))
            continue;

          var div = b.querySelector('div.key-hint');
          if (!div) {
            var text = b.textContent;
            if (text in usedWords) {
              var key = usedWords[text];
              div = document.createElement('div');
              div.classList.add('key-hint');
              b.insertBefore(div, b.firstChild);
              div.textContent = key;
              currentButtons[key] = b;
            }
          } else {
            var key = b.childNodes[0].textContent;
            currentButtons[key] = b;
          }
        }
      }
    }
    catch (e) {
      log(e);
    }
  }

  // Key event handler
  document.addEventListener('keydown', function(event) {
    try {
      var passThrough = (function() {
        var c = event.key.toUpperCase();
        if (c in currentButtons && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
          //log('Dispatching!');
          currentButtons[c].click();
          checkDom();
          return false;
        }
        // Ctrl+Space: listen
        var keyJSON = JSON.stringify([c, event.shiftKey, event.ctrlKey, event.metaKey, event.altKey]);
        if (keyJSON == listenKey) {
          let listenButtons = document.getElementsByClassName(classNameListen);
          if (listenButtons.length) {
            listenButtons[0].click();
            return false;
          }
        }
        // Ctrl+Shift+Space: listen slowly
        if (keyJSON == listenSlowlyKey) {
          let listenButtons = document.getElementsByClassName(classNameListen);
          if (listenButtons.length) {
            listenButtons[listenButtons.length-1].click();
            return false;
          }
        }
        return true;
      })();
      if (!passThrough) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();
      }
      return passThrough;
    }
    catch (e) {
      log(e);
    }
    return true;
  }, true);

  setInterval(checkDom, 100);
  log('"More Duolingo keyboard hotkeys" loaded');
}) ();
