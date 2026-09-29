/* Sagun B. Pradhan — Pokémon Pomodoro
   A Pomodoro timer as a Pokémon battle (src/pomodoro/index.njk).
     focus  — a wild Pokémon's HP drains with the time left; when it faints it's caught
     break  — Nurse Chansey heals the team; every 4th catch earns a long break
   Menu: FIGHT starts / pauses · BAG opens settings · SKIP ends the phase · RUN resets it.
   Keys: Space, S, R. The timer runs off an end time (not a counter), so it stays accurate in a
   background tab and survives a refresh; state and today's catches live in localStorage.
   Sounds come from assets/js/chiptune.js and follow the site-wide sound setting. */

(function () {
  'use strict';

  var root = document.querySelector('[data-pomodoro]');
  if (!root) return;

  var script = document.currentScript || document.querySelector('script[src*="pomodoro.js"]');
  var ASSETS = script.src.replace(/js\/pomodoro\.js.*$/, '');
  var Chip = window.Chip || { note: function () {}, seq: function () {}, isOn: function () { return false; }, toggle: function () { return false; } };
  var CHANSEY = 113;
  var ROUND = 4;                                  // focus sessions before a long break
  var KEY = 'pomo-state';

  function q(sel) { return root.querySelector(sel); }
  var ui = {
    name: q('.pomo__name'), lv: q('.pomo__lv b'), fill: q('.pomo__fill'), track: q('.pomo__track'),
    time: q('.pomo__time'), sprite: q('.pomo__sprite'), foe: q('.pomo__foe'), party: q('.pomo__party'),
    dialog: q('.pomo__dialog'), toggle: q('[data-act="toggle"]'), bagBtn: q('[data-act="bag"]'),
    bag: q('.pomo__bag'), box: q('.pomo__box'), count: q('.pomo__count')
  };

  /* ---- State ----------------------------------------------------------- */
  var pool = [];
  var today = new Date().toISOString().slice(0, 10);
  var st = {
    phase: 'focus',            // focus | short | long
    running: false,
    endAt: 0,                  // ms timestamp while running
    left: 25 * 60 * 1000,      // ms left while paused
    total: 25 * 60 * 1000,
    foe: 25,
    done: 0,                   // focus sessions finished this round
    mins: { focus: 25, short: 5, long: 15 },
    caught: { day: today, list: [] }
  };

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* not remembered */ }
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.mins) st = Object.assign(st, s);
    } catch (e) { /* start fresh */ }
    if (st.caught.day !== today) st.caught = { day: today, list: [] };
  }

  function mins(phase) { return st.mins[phase] * 60 * 1000; }
  function remaining() { return st.running ? Math.max(0, st.endAt - Date.now()) : st.left; }
  function name(id) {
    var m = pool.find(function (p) { return p.id === id; });
    return m ? m.name : 'MISSINGNO.';
  }
  function randomFoe() {
    var ids = pool.length ? pool.map(function (p) { return p.id; }) : [25];
    var id;
    do { id = ids[Math.floor(Math.random() * ids.length)]; } while (id === CHANSEY && ids.length > 1);
    return id;
  }
  function clock(ms) {
    var s = Math.ceil(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  function say(text) { ui.dialog.textContent = text; }

  /* ---- Sounds ---------------------------------------------------------- */
  var SFX = {
    start: function () { Chip.seq([[523, 70, 0.04], [659, 70, 0.04], [784, 70, 0.04], [1047, 160, 0.04]]); },
    pause: function () { Chip.seq([[784, 60, 0.035], [523, 90, 0.035]]); },
    win:   function () { Chip.seq([[784, 110, 0.045], [784, 110, 0.045], [784, 110, 0.045], [1047, 380, 0.045], [932, 200, 0.045], [1047, 500, 0.045]]); },
    heal:  function () { Chip.seq([[1175, 120, 0.04], [988, 120, 0.04], [1175, 120, 0.04], [1568, 420, 0.04]]); },
    press: function () { Chip.note(1400, 22, 0.025); }
  };

  /* ---- Rendering ------------------------------------------------------- */
  function render() {
    var ms = remaining();
    var pct = st.total ? ms / st.total : 0;
    var focus = st.phase === 'focus';

    // focus: HP = time left (drains). break: HP = time rested (fills as Chansey heals)
    var hp = focus ? pct : 1 - pct;
    ui.fill.style.width = (hp * 100).toFixed(2) + '%';
    root.classList.toggle('is-low', hp <= 0.2);
    root.classList.toggle('is-mid', hp > 0.2 && hp <= 0.5);
    ui.track.setAttribute('aria-valuenow', String(Math.round(hp * 100)));
    ui.time.textContent = clock(ms);
    document.title = (st.running ? clock(ms) + ' · ' : '') + (focus ? 'Focus' : 'Break') + ' — Pokémon Pomodoro';

    ui.toggle.textContent = st.running ? 'PAUSE' : 'FIGHT';
    root.classList.toggle('is-running', st.running);
    root.classList.toggle('is-break', !focus);
  }

  function renderFoe() {
    var id = st.phase === 'focus' ? st.foe : CHANSEY;
    ui.sprite.src = ASSETS + 'img/pokemon/' + id + '.png';
    ui.sprite.alt = st.phase === 'focus' ? 'Wild ' + name(id) : 'Nurse Chansey';
    ui.name.textContent = (st.phase === 'focus' ? '' : 'NURSE ') + name(id).toUpperCase();
    ui.lv.textContent = String(st.mins[st.phase]);
  }

  function renderParty() {
    ui.party.textContent = '';
    for (var i = 0; i < ROUND; i++) {
      var ball = document.createElement('span');
      ball.className = 'pokeball pokeball--sm' + (i < st.done ? '' : ' is-empty');
      ui.party.appendChild(ball);
    }
    ui.party.setAttribute('aria-label', st.done + ' of ' + ROUND + ' sessions this round');
  }

  function renderBox() {
    ui.box.textContent = '';
    st.caught.list.forEach(function (id) {
      var li = document.createElement('li');
      var img = document.createElement('img');
      img.src = ASSETS + 'img/pokemon/' + id + '.png';
      img.width = 48; img.height = 48;
      img.alt = name(id);
      img.title = name(id);
      li.appendChild(img);
      ui.box.appendChild(li);
    });
    ui.count.textContent = String(st.caught.list.length);
  }

  function intro() {
    if (st.phase === 'focus') {
      say(st.running ? 'Keep going! Wild ' + name(st.foe).toUpperCase() + ' is weakening…'
                     : 'A wild ' + name(st.foe).toUpperCase() + ' appeared! Press FIGHT to start focusing.');
    } else {
      say(st.running ? 'Resting at the POKéMON CENTER…'
                     : (st.phase === 'long' ? 'Long break earned! ' : 'Break time! ') + 'Press FIGHT to rest with NURSE CHANSEY.');
    }
  }

  /* ---- Phases ---------------------------------------------------------- */
  function setPhase(phase, keepSprite) {
    st.phase = phase;
    st.running = false;
    st.total = st.left = mins(phase);
    if (phase === 'focus') st.foe = randomFoe();
    if (!keepSprite) renderFoe();
    renderParty();
    intro();
    render();
    save();
  }

  function finish() {
    st.running = false;
    if (st.phase === 'focus') {
      st.done += 1;
      st.caught.list.push(st.foe);
      var caught = name(st.foe).toUpperCase();
      SFX.win();
      var next = st.done >= ROUND ? 'long' : 'short';
      renderBox();
      // let the fainted Pokémon shrink into its Poké Ball before Nurse Chansey takes its place
      root.classList.add('is-caught');
      setTimeout(function () { root.classList.remove('is-caught'); renderFoe(); }, 1400);
      setPhase(next, true);
      say('Wild ' + caught + ' fainted! Gotcha! ' + caught + ' was caught! ' +
          (next === 'long' ? 'Long break earned. Press FIGHT to rest.' : 'Press FIGHT for a short break.'));
    } else {
      if (st.phase === 'long') st.done = 0;
      SFX.heal();
      setPhase('focus');
      say('Your team is fully healed! A wild ' + name(st.foe).toUpperCase() + ' appeared! Press FIGHT to focus.');
    }
  }

  var actions = {
    toggle: function () {
      if (st.running) {
        st.left = remaining();
        st.running = false;
        SFX.pause();
        say('Paused. Press FIGHT to continue.');
      } else {
        st.endAt = Date.now() + st.left;
        st.running = true;
        SFX.start();
        intro();
      }
      render();
      save();
    },
    skip: function () { SFX.press(); finish(); },
    reset: function () {
      SFX.press();
      st.running = false;
      st.left = st.total;
      say('Got away safely! The timer is reset. Press FIGHT to start again.');
      render();
      save();
    },
    bag: function () {
      SFX.press();
      var open = ui.bag.hidden;
      ui.bag.hidden = !open;
      ui.bagBtn.setAttribute('aria-expanded', String(open));
    },
    clear: function () {
      st.caught.list = [];
      renderBox();
      save();
    }
  };

  root.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]');
    if (btn) actions[btn.getAttribute('data-act')]();
  });

  // settings: durations apply to the next phase (or now, if the timer hasn't started)
  ui.bag.addEventListener('change', function (e) {
    var el = e.target;
    if (el.name === 'sound') { if (el.checked !== Chip.isOn()) Chip.toggle(); return; }
    var v = Math.max(1, Math.min(parseInt(el.max, 10), parseInt(el.value, 10) || 1));
    el.value = v;
    st.mins[el.name] = v;
    if (!st.running && st.left === st.total && el.name === st.phase) {
      st.total = st.left = mins(st.phase);
      renderFoe();
      render();
    }
    save();
  });
  ui.bag.addEventListener('submit', function (e) { e.preventDefault(); });

  document.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea, select, .dex')) return;
    var k = e.key.toLowerCase();
    if (k === ' ' && !e.target.closest('button')) { e.preventDefault(); actions.toggle(); }
    else if (k === 's') actions.skip();
    else if (k === 'r') actions.reset();
  });

  /* ---- Loop -------------------------------------------------------------- */
  function tick() {
    if (st.running && remaining() <= 0) finish();
    render();
  }

  function start() {
    load();
    ['focus', 'short', 'long'].forEach(function (n) { ui.bag.elements[n].value = st.mins[n]; });
    ui.bag.elements.sound.checked = Chip.isOn();
    document.addEventListener('chip:sound', function () { ui.bag.elements.sound.checked = Chip.isOn(); });
    if (!pool.some(function (p) { return p.id === st.foe; })) st.foe = randomFoe();
    renderFoe();
    renderParty();
    renderBox();
    if (st.running && remaining() <= 0) finish(); else intro();
    render();
    setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
  }

  fetch(ASSETS + 'data/pokemon.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { pool = data; }, function () { pool = []; })
    .then(start);
}());
