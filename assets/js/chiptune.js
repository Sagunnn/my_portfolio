/* Sagun B. Pradhan — shared Game Boy-style sound
   Square-wave notes made with Web Audio (no audio files), used by the Pokédex and Professor Oak.
   One on/off setting for the whole site, remembered per browser; toggling it fires a
   "chip:sound" event so every sound button can update. Load before pokedex.js and oak.js.
     Chip.note(freq, ms, vol)       one note now
     Chip.seq([[freq, ms], …])      notes back to back
     Chip.isOn() / Chip.toggle()    the site-wide setting */

(function () {
  'use strict';

  var KEY = 'site-sound';
  var ctx = null;
  var on = true;
  try {
    var saved = localStorage.getItem(KEY);
    if (saved === null) saved = localStorage.getItem('oak-sound');   // setting from before it was shared
    on = saved !== 'off';
  } catch (e) { /* storage blocked — default on */ }

  function note(freq, ms, vol, delayMs) {
    if (!on) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      var t = ctx.currentTime + (delayMs || 0) / 1000;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + ms / 1000 + 0.01);
    } catch (e) { /* no Web Audio — stay silent */ }
  }

  // scheduled on the audio clock, so the notes stay in time
  function seq(notes) {
    var at = 0;
    notes.forEach(function (n) { note(n[0], n[1], n[2], at); at += n[1]; });
  }

  function set(value) {
    on = value;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* not remembered */ }
    document.dispatchEvent(new CustomEvent('chip:sound', { detail: on }));
  }

  window.Chip = {
    note: note,
    seq: seq,
    isOn: function () { return on; },
    toggle: function () { set(!on); return on; }
  };
}());
