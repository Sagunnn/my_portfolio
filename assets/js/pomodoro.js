/* Sagun B. Pradhan — Pokémon Pomodoro
   A Pomodoro timer as a Pokémon battle (src/pomodoro/index.njk).
     focus  — a wild Pokémon's HP drains with the time left. Finish the timer and a thrown
              Poké Ball wobbles three times and catches it; give up part-way (SKIP or RUN)
              and the ball wobbles, bursts open and the Pokémon flees
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
  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false;                               // a catch animation is playing

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
    press: function () { Chip.note(1400, 22, 0.025); },
    toss:  function () { Chip.seq([[1320, 40, 0.035], [990, 40, 0.035], [740, 70, 0.035]]); },
    pull:  function () { Chip.seq([[392, 60, 0.04], [784, 90, 0.04]]); },
    wobble: function () { Chip.note(196, 70, 0.05); },
    click: function () { Chip.seq([[1568, 40, 0.045], [2093, 110, 0.045]]); },
    burst: function () { Chip.seq([[294, 40, 0.05], [523, 40, 0.05], [196, 140, 0.05]]); },
    flee:  function () { Chip.seq([[660, 60, 0.035], [523, 60, 0.035], [392, 60, 0.035], [262, 160, 0.035]]); }
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

  /* ---- The catch ------------------------------------------------------- */
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function play(el, frames, opts) {
    return motionOK ? el.animate(frames, Object.assign({ fill: 'forwards' }, opts)).finished : Promise.resolve();
  }

  // throw a Poké Ball at the wild Pokémon: success = it wobbles 3 times and clicks shut;
  // otherwise it wobbles once or twice, bursts open and the Pokémon runs away
  function throwBall(success) {
    var scene = q('.pomo__scene');
    var s = scene.getBoundingClientRect();
    var spr = ui.sprite.getBoundingClientRect();
    var home = q('.pomo__trainer > .pokeball').getBoundingClientRect();
    var B = 28;
    var hitX = spr.left - s.left + spr.width / 2 - B / 2;
    var hitY = spr.top - s.top + spr.height * 0.45 - B / 2;
    var drop = spr.height * 0.38;                       // from the hit point down to the ground
    var fromX = home.left - s.left + home.width / 2 - B / 2 - hitX;
    var fromY = home.top - s.top + home.height / 2 - B / 2 - hitY;
    var foe = name(st.foe).toUpperCase();

    var ball = document.createElement('span');
    ball.className = 'pokeball pomo__ball';
    ball.setAttribute('aria-hidden', 'true');
    ball.style.left = hitX + 'px';
    ball.style.top = hitY + 'px';
    if (motionOK) scene.appendChild(ball);

    var on = function (dy, deg) { return { transform: 'translate(0, ' + dy + 'px) rotate(' + deg + 'deg)' }; };
    var wobbles = success ? 3 : 1 + Math.floor(Math.random() * 2);

    say('SAGUN threw a POKé BALL!');
    SFX.toss();
    return play(ball, [
      { transform: 'translate(' + fromX + 'px, ' + fromY + 'px) rotate(-720deg)' },
      { transform: 'translate(' + (fromX * 0.45) + 'px, ' + (Math.min(fromY, 0) - 110) + 'px) rotate(-280deg)', offset: 0.55 },
      { transform: 'translate(0, 0) rotate(0)' }
    ], { duration: 650, easing: 'cubic-bezier(0.3, 0.6, 0.4, 1)' })
      .then(function () {                               // the Pokémon is pulled in; the ball hops and drops
        SFX.pull();
        play(ui.sprite, [
          { transform: 'scale(1)', filter: 'brightness(1)', opacity: 1 },
          { transform: 'scale(1.05)', filter: 'brightness(3)', offset: 0.3 },
          { transform: 'scale(0)', filter: 'brightness(3)', opacity: 0 }
        ], { duration: 420, easing: 'ease-in' });
        return play(ball, [on(0, 0), on(-24, 0), on(drop, 0)], { duration: 560, easing: 'ease-in' });
      })
      .then(function () { return wait(350); })
      .then(function loop(n) {                          // the wobbles
        n = n || 0;
        if (n >= wobbles) return;
        say(['…', '… …', '… … …'][n]);
        SFX.wobble();
        var tilt = n % 2 ? 22 : -22;
        return play(ball, [on(drop, 0), on(drop, tilt), on(drop, 0), on(drop, 0)], { duration: 760, easing: 'ease-in-out' })
          .then(function () { return wait(motionOK ? 150 : 350); })
          .then(function () { return loop(n + 1); });
      })
      .then(function () {
        if (success) {                                  // click: stars, and the button dims
          SFX.click();
          ball.classList.add('is-shut');
          if (motionOK) {
            [-1, 0, 1].forEach(function (d) {
              var star = document.createElement('span');
              star.className = 'pomo__star';
              star.textContent = '✦';
              star.style.left = (hitX + B / 2) + 'px';
              star.style.top = (hitY + drop) + 'px';
              scene.appendChild(star);
              play(star, [
                { transform: 'translate(-50%, 0) scale(0.5)', opacity: 1 },
                { transform: 'translate(calc(-50% + ' + (d * 34) + 'px), -44px) scale(1)', opacity: 0 }
              ], { duration: 700, easing: 'ease-out' }).then(function () { star.remove(); });
            });
          }
          say('Gotcha! ' + foe + ' was caught!');
          return wait(500).then(function () { SFX.win(); return wait(1700); });
        }
        SFX.burst();                                    // it breaks free…
        play(ball, [on(drop, 0), { transform: 'translate(0, ' + drop + 'px) scale(1.6)', opacity: 0, filter: 'brightness(3)' }],
             { duration: 300, easing: 'ease-out' });
        say('Oh no! The POKéMON broke free!');
        return play(ui.sprite, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.12)', opacity: 1, offset: 0.7 },
          { transform: 'scale(1)', opacity: 1 }
        ], { duration: 420, easing: 'ease-out' })
          .then(function () { return wait(700); })
          .then(function () {                           // …and flees
            SFX.flee();
            say('Wild ' + foe + ' fled!');
            return play(ui.sprite, [
              { transform: 'translateX(0)', opacity: 1 },
              { transform: 'translateX(40px) scaleX(-1)', offset: 0.15 },
              { transform: 'translateX(300px) scaleX(-1)', opacity: 0 }
            ], { duration: 700, easing: 'ease-in' });
          })
          .then(function () { return wait(400); });
      })
      .then(function () {                               // tidy up for the next scene
        ball.remove();
        ui.sprite.getAnimations().forEach(function (a) { a.cancel(); });
      });
  }

  function attempt(success) {
    busy = true;
    root.classList.add('is-busy');
    root.classList.remove('is-running');           // stop the idle bob while the ball flies
    if (success) st.left = 0;                       // show 00:00 and an empty HP bar during the catch
    else st.left = remaining();
    st.running = false;
    render();
    save();
    var foe = name(st.foe).toUpperCase();
    return throwBall(success).then(function () {
      busy = false;
      root.classList.remove('is-busy');
      if (success) {
        st.done += 1;
        st.caught.list.push(st.foe);
        renderBox();
        var next = st.done >= ROUND ? 'long' : 'short';
        setPhase(next);
        say(foe + ' was caught! ' + (next === 'long' ? 'Long break earned. Press FIGHT to rest.' : 'Press FIGHT for a short break.'));
      } else {
        setPhase('focus');
        say(foe + ' got away! A wild ' + name(st.foe).toUpperCase() + ' appeared. Press FIGHT to try again.');
      }
    });
  }

  // a phase's timer reached zero
  function complete() {
    if (busy) return;
    if (st.phase === 'focus') { attempt(true); return; }
    if (st.phase === 'long') st.done = 0;
    SFX.heal();
    setPhase('focus');
    say('Your team is fully healed! A wild ' + name(st.foe).toUpperCase() + ' appeared! Press FIGHT to focus.');
  }

  function started() { return st.running || st.left < st.total; }

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
    // giving up part-way through focus means the catch fails
    skip: function () {
      SFX.press();
      if (st.phase !== 'focus') { complete(); return; }
      if (started()) { attempt(false); return; }
      var old = name(st.foe).toUpperCase();
      setPhase('focus');
      say('The wild ' + old + ' wandered off. A wild ' + name(st.foe).toUpperCase() + ' appeared!');
    },
    reset: function () {
      SFX.press();
      if (st.phase === 'focus' && started()) { attempt(false); return; }
      st.running = false;
      st.left = st.total;
      say(st.phase === 'focus' ? 'Got away safely! Press FIGHT when you are ready.' : 'Break timer reset. Press FIGHT to rest.');
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
    if (btn && !busy) actions[btn.getAttribute('data-act')]();
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
    if (busy || e.target.closest('input, textarea, select, .dex')) return;
    var k = e.key.toLowerCase();
    if (k === ' ' && !e.target.closest('button')) { e.preventDefault(); actions.toggle(); }
    else if (k === 's') actions.skip();
    else if (k === 'r') actions.reset();
  });

  /* ---- Loop -------------------------------------------------------------- */
  function tick() {
    if (st.running && remaining() <= 0) complete();
    if (!busy) render();
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
    if (st.running && remaining() <= 0) complete(); else intro();
    render();
    setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
  }

  fetch(ASSETS + 'data/pokemon.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { pool = data; }, function () { pool = []; })
    .then(start);
}());
