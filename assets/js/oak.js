/* Sagun B. Pradhan — Professor Oak dialogue
   Turns every [data-oak] block into a Game Boy-style conversation: Professor Oak
   (assets/img/oak.png) types out the <li> lines one at a time, with square-wave "blip"
   sounds made by Web Audio.
   Without JavaScript the block stays a plain list of takeaways.
     A / click / Enter / Space   finish the line, or go to the next one
     Show all                    reveal every line as a list
     ♪ button                    sound on/off (remembered per browser) */

(function () {
  'use strict';

  var blocks = document.querySelectorAll('[data-oak]');
  if (!blocks.length) return;

  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TYPE_MS = 28;

  var script = document.currentScript || document.querySelector('script[src*="oak.js"]');
  var ASSETS = script.src.replace(/js\/oak\.js.*$/, '');

  function professor() {
    var img = document.createElement('img');
    img.className = 'oak__sprite';
    img.src = ASSETS + 'img/oak.png';
    img.width = 152;
    img.height = 360;
    img.alt = '';
    return img;
  }

  /* ---- Sound: short square-wave blips ---------------------------------- */
  var audio = null;
  var soundOn = true;
  try { soundOn = localStorage.getItem('oak-sound') !== 'off'; } catch (e) { /* default on */ }

  function blip(freq, ms, vol) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      var osc = audio.createOscillator();
      var gain = audio.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.035, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + ms / 1000);
      osc.connect(gain).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + ms / 1000);
    } catch (e) { /* no Web Audio — stay silent */ }
  }
  function talkBlip() { blip(640 + Math.random() * 120, 32); }
  function nextBlip() { blip(988, 50, 0.04); setTimeout(function () { blip(1319, 70, 0.04); }, 55); }

  /* ---- Dialogue -------------------------------------------------------- */
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function setup(block) {
    var list = block.querySelector('ol, ul');
    var lines = Array.prototype.map.call(list.querySelectorAll('li'), function (li) {
      return li.textContent.replace(/\s+/g, ' ').trim();
    });
    if (!lines.length) return;

    block.classList.add('oak--live');

    var stage = el('div', 'oak__stage');
    var figure = el('div', 'oak__figure');
    figure.appendChild(professor());
    stage.appendChild(figure);

    var box = el('button', 'oak__box');
    box.type = 'button';
    var speaker = el('span', 'oak__speaker', 'PROF. OAK');
    var text = el('span', 'oak__text');
    text.setAttribute('aria-hidden', 'true');   // the live region below reads whole lines
    var arrow = el('span', 'oak__arrow', '▼');
    arrow.setAttribute('aria-hidden', 'true');
    box.appendChild(speaker);
    box.appendChild(text);
    box.appendChild(arrow);
    stage.appendChild(box);

    var live = el('p', 'oak__sr');
    live.setAttribute('aria-live', 'polite');

    var bar = el('div', 'oak__bar');
    var count = el('span', 'oak__count');
    var showAll = el('button', 'oak__btn', 'Show all');
    showAll.type = 'button';
    showAll.setAttribute('aria-expanded', 'false');
    var sound = el('button', 'oak__btn oak__btn--sound');
    sound.type = 'button';
    bar.appendChild(count);
    bar.appendChild(sound);
    bar.appendChild(showAll);

    list.parentNode.insertBefore(stage, list);
    list.parentNode.insertBefore(bar, list);
    list.parentNode.insertBefore(live, list);
    list.hidden = true;

    var line = -1;        // -1 = the "press A" prompt
    var shown = 0;        // characters of the current line on screen
    var timer = null;

    function syncSound() {
      sound.textContent = soundOn ? '♪ Sound on' : '♪ Sound off';
      sound.setAttribute('aria-pressed', String(soundOn));
    }

    function status() {
      count.textContent = line < 0 ? lines.length + ' takeaways' : (line + 1) + ' / ' + lines.length;
      box.setAttribute('aria-label', line < 0
        ? 'Talk to Professor Oak'
        : line < lines.length - 1 ? 'Next line' : 'Start again');
    }

    function typing() { return timer !== null; }

    function finishLine() {
      clearInterval(timer);
      timer = null;
      text.textContent = lines[line];
      box.classList.add('is-done');
    }

    function play(i) {
      line = i;
      shown = 0;
      box.classList.remove('is-done');
      live.textContent = lines[line];
      status();
      if (!motionOK) { finishLine(); talkBlip(); return; }
      text.textContent = '';
      timer = setInterval(function () {
        shown += 1;
        var ch = lines[line].charAt(shown - 1);
        text.textContent = lines[line].slice(0, shown);
        if (ch && ch !== ' ' && shown % 2) talkBlip();
        if (shown >= lines[line].length) finishLine();
      }, TYPE_MS);
    }

    function prompt() {
      line = -1;
      text.textContent = 'PROF. OAK wants to share the key takeaways! Press ▶ to talk.';
      box.classList.add('is-done');
      status();
    }

    box.addEventListener('click', function () {
      if (typing()) { finishLine(); return; }
      nextBlip();
      play(line + 1 < lines.length ? line + 1 : 0);
    });

    showAll.addEventListener('click', function () {
      var open = list.hidden;
      list.hidden = !open;
      showAll.textContent = open ? 'Hide list' : 'Show all';
      showAll.setAttribute('aria-expanded', String(open));
    });

    sound.addEventListener('click', function () {
      soundOn = !soundOn;
      try { localStorage.setItem('oak-sound', soundOn ? 'on' : 'off'); } catch (e) { /* not remembered */ }
      syncSound();
      if (soundOn) nextBlip();
    });

    syncSound();
    prompt();
  }

  Array.prototype.forEach.call(blocks, setup);
}());
