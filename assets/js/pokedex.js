/* Sagun B. Pradhan — Pokédex
   A launcher fixed to the bottom-right of every page that opens a fold-out Pokédex.
     D-pad ◀ ▶      previous / next Pokémon
     D-pad ▲ ▼      switch between the INFO and STATS pages
     black button   random Pokémon
     blue keypad    type a Pokédex number · CLR clears · GO jumps (3 digits jump on their own)
     yellow button  the Pokémon currently shown in the DDIA progress box
   Keyboard, while the Pokédex has focus: arrows, 0–9, Enter, Backspace, R, Esc.
   Data comes from PokeAPI via scripts/fetch_pokemon.py and is served locally. */

(function () {
  'use strict';

  var script = document.currentScript || document.querySelector('script[src*="pokedex.js"]');
  var ASSETS = script.src.replace(/js\/pokedex\.js.*$/, '');
  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAGES = ['info', 'stats'];
  var STATS = [['hp', 'HP'], ['atk', 'ATK'], ['def', 'DEF'], ['spa', 'SP.ATK'], ['spd', 'SP.DEF'], ['spe', 'SPD']];

  /* ---- Markup -------------------------------------------------------- */
  var launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'dex-launch';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'pokedex');
  launcher.setAttribute('aria-label', 'Open Pokédex');
  launcher.innerHTML =
    '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<rect x="2" y="2" width="96" height="96" rx="24" fill="#fff"/>' +
      '<rect x="7" y="7" width="86" height="86" rx="19" fill="#161616"/>' +
      '<rect x="11" y="11" width="78" height="78" rx="15" fill="#dc2a1f"/>' +
      '<path d="M11 60 H34 C45 60 48 47 60 47 H89" fill="none" stroke="#a3150e" stroke-width="7"/>' +
      '<path d="M11 57 H34 C45 57 48 44 60 44 H89" fill="none" stroke="#161616" stroke-width="2.5"/>' +
      '<path d="M11 63.5 H34 C45 63.5 48 50.5 60 50.5 H89" fill="none" stroke="#161616" stroke-width="2.5"/>' +
      '<path d="M79 51 V89" stroke="#161616" stroke-width="2.5"/>' +
      '<circle cx="33" cy="32" r="15" fill="#fff" stroke="#161616" stroke-width="2"/>' +
      '<circle cx="33" cy="32" r="11.5" fill="#2f6fe4" stroke="#161616" stroke-width="1.5"/>' +
      '<circle cx="29" cy="27.5" r="3" fill="#fff"/>' +
      '<circle cx="58" cy="22" r="4" fill="#d42121" stroke="#161616" stroke-width="1.5"/>' +
      '<circle cx="69" cy="22" r="4" fill="#f2d535" stroke="#161616" stroke-width="1.5"/>' +
      '<circle cx="80" cy="22" r="4" fill="#2e9a3e" stroke="#161616" stroke-width="1.5"/>' +
      '<path d="M26 69 L37 76 L26 83 Z" fill="#f7dc3b" stroke="#161616" stroke-width="1.5" stroke-linejoin="round"/>' +
    '</svg>';

  var digits = '';
  for (var d = 1; d <= 10; d++) {
    var n = d % 10;
    digits += '<button type="button" data-digit="' + n + '" aria-label="' + n + '">' + n + '</button>';
  }

  var dex = document.createElement('div');
  dex.className = 'dex';
  dex.id = 'pokedex';
  dex.setAttribute('role', 'dialog');
  dex.setAttribute('aria-label', 'Pokédex');
  dex.tabIndex = -1;
  dex.hidden = true;
  dex.innerHTML =
    '<div class="dex__left">' +
      '<svg class="dex__trim" viewBox="0 0 320 90" preserveAspectRatio="none" aria-hidden="true">' +
        '<path d="M0 78 H150 C176 78 180 58 206 58 H320" fill="none" stroke="#161616" stroke-width="3"/>' +
        '<path d="M0 84 H150 C176 84 180 64 206 64 H320" fill="none" stroke="#a3081f" stroke-width="4"/>' +
      '</svg>' +
      '<div class="dex__top">' +
        '<span class="dex__lens"></span>' +
        '<span class="dex__lights"><i></i><i></i><i></i></span>' +
        '<button type="button" class="dex__close" data-act="close" aria-label="Close Pokédex">×</button>' +
      '</div>' +
      '<div class="dex__bezel">' +
        '<span class="dex__bezel-dots"><i></i><i></i></span>' +
        '<div class="dex__screen"><img class="dex__sprite" width="96" height="96" alt=""></div>' +
        '<span class="dex__bezel-foot"><i class="dex__led"></i><i class="dex__grill"></i></span>' +
      '</div>' +
      '<div class="dex__controls">' +
        '<div class="dex__col">' +
          '<button type="button" class="dex__round" data-act="random" aria-label="Random Pokémon"></button>' +
          '<span class="dex__label">RND</span>' +
        '</div>' +
        '<div class="dex__col dex__col--mid">' +
          '<span class="dex__slits"><i></i><i></i></span>' +
          '<output class="dex__green">No.001</output>' +
        '</div>' +
        '<div class="dex__col">' +
          '<div class="dex__pad" role="group" aria-label="Direction pad">' +
            '<button type="button" class="dex__pad-up" data-act="up" aria-label="Previous page">▲</button>' +
            '<button type="button" class="dex__pad-left" data-act="left" aria-label="Previous Pokémon">◀</button>' +
            '<span class="dex__pad-mid"></span>' +
            '<button type="button" class="dex__pad-right" data-act="right" aria-label="Next Pokémon">▶</button>' +
            '<button type="button" class="dex__pad-down" data-act="down" aria-label="Next page">▼</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="dex__hinge" aria-hidden="true"></div>' +
    '<div class="dex__right">' +
      '<div class="dex__info" aria-live="polite">' +
        '<p class="dex__head"><span class="dex__name">LOADING…</span><span class="dex__page-no">INFO 1/2</span></p>' +
        '<p class="dex__genus"></p>' +
        '<p class="dex__types"></p>' +
        '<p class="dex__text" data-page="info"></p>' +
        '<dl class="dex__stats" data-page="stats" hidden></dl>' +
      '</div>' +
      '<div class="dex__keys" role="group" aria-label="Enter a Pokédex number">' + digits + '</div>' +
      '<div class="dex__row">' +
        '<span class="dex__whites">' +
          '<button type="button" data-act="clear">CLR</button>' +
          '<button type="button" data-act="go">GO</button>' +
        '</span>' +
        '<span class="dex__col">' +
          '<button type="button" class="dex__yellow" data-act="partner" aria-label="Show my DDIA partner Pokémon"></button>' +
          '<span class="dex__label">DDIA</span>' +
        '</span>' +
      '</div>' +
      '<div class="dex__bottom">' +
        '<output class="dex__ht">HT —</output>' +
        '<output class="dex__wt">WT —</output>' +
      '</div>' +
    '</div>';

  document.body.appendChild(dex);
  document.body.appendChild(launcher);

  function q(sel) { return dex.querySelector(sel); }
  var ui = {
    sprite: q('.dex__sprite'), green: q('.dex__green'), name: q('.dex__name'),
    pageNo: q('.dex__page-no'), genus: q('.dex__genus'), types: q('.dex__types'),
    text: q('.dex__text'), stats: q('.dex__stats'), ht: q('.dex__ht'), wt: q('.dex__wt')
  };

  /* ---- State --------------------------------------------------------- */
  var pool = null;      // [{id, name, types}]
  var details = null;   // [{id, genus, text, height, weight, stats}]
  var idx = 0;
  var page = 0;
  var typed = '';
  var loading = null;

  function load() {
    if (!loading) {
      loading = Promise.all([
        fetch(ASSETS + 'data/pokemon.json').then(function (r) { return r.json(); }),
        fetch(ASSETS + 'data/pokedex.json').then(function (r) { return r.json(); })
      ]).then(function (res) {
        pool = res[0];
        details = res[1];
      }, function () {
        loading = null;
        ui.name.textContent = 'NO SIGNAL';
        ui.genus.textContent = 'Could not load Pokédex data.';
      });
    }
    return loading;
  }

  function pad3(n) { return ('00' + n).slice(-3); }

  function render() {
    if (!pool) return;
    var mon = pool[idx];
    var info = details[idx];

    ui.sprite.src = ASSETS + 'img/pokemon/' + mon.id + '.png';
    ui.sprite.alt = mon.name;
    ui.green.textContent = typed ? 'No.' + (typed + '___').slice(0, 3) : 'No.' + pad3(mon.id);
    ui.name.textContent = mon.name.toUpperCase();
    ui.genus.textContent = info.genus;

    ui.types.textContent = '';
    mon.types.forEach(function (t) {
      var chip = document.createElement('span');
      chip.className = 'dex__type dex__type--' + t;
      chip.textContent = t.toUpperCase();
      ui.types.appendChild(chip);
    });

    ui.text.textContent = info.text;

    ui.stats.textContent = '';
    STATS.forEach(function (s) {
      var val = info.stats[s[0]];
      var dt = document.createElement('dt');
      dt.textContent = s[1];
      var dd = document.createElement('dd');
      var bar = document.createElement('span');
      bar.className = 'dex__bar';
      var fill = document.createElement('span');
      fill.style.width = Math.min(100, Math.round(val / 1.6)) + '%';   // ~160 fills the bar for Gen 1
      bar.appendChild(fill);
      var num = document.createElement('b');
      num.textContent = val;
      dd.appendChild(num);
      dd.appendChild(bar);
      ui.stats.appendChild(dt);
      ui.stats.appendChild(dd);
    });

    ui.text.hidden = PAGES[page] !== 'info';
    ui.stats.hidden = PAGES[page] !== 'stats';
    ui.pageNo.textContent = PAGES[page].toUpperCase() + ' ' + (page + 1) + '/' + PAGES.length;

    ui.ht.textContent = 'HT ' + info.height.toFixed(1) + ' m';
    ui.wt.textContent = 'WT ' + info.weight.toFixed(1) + ' kg';
  }

  function showId(id) {
    var i = pool.findIndex(function (m) { return m.id === id; });
    if (i >= 0) { idx = i; typed = ''; render(); return true; }
    return false;
  }

  function partnerId() {
    return parseInt(document.documentElement.getAttribute('data-ddia-partner'), 10) || 25;
  }

  /* ---- Actions ------------------------------------------------------- */
  var actions = {
    left: function () { idx = (idx - 1 + pool.length) % pool.length; typed = ''; render(); },
    right: function () { idx = (idx + 1) % pool.length; typed = ''; render(); },
    up: function () { page = (page - 1 + PAGES.length) % PAGES.length; render(); },
    down: function () { page = (page + 1) % PAGES.length; render(); },
    random: function () { idx = Math.floor(Math.random() * pool.length); typed = ''; render(); },
    partner: function () { showId(partnerId()); },
    clear: function () { typed = ''; render(); },
    go: function () {
      if (!typed) return;
      if (!showId(parseInt(typed, 10))) {
        typed = '';
        render();
        ui.green.textContent = 'No.???';
      }
    },
    digit: function (n) {
      typed = (typed + n).slice(0, 3);
      if (typed.length === 3) actions.go(); else render();
    },
    close: function () { close(); }
  };

  function run(act, arg) {
    if (act === 'close') return close();
    if (!pool) return;
    actions[act](arg);
  }

  dex.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    // after a mouse click, hand focus back to the device so typing and Enter act as shortcuts
    // instead of re-pressing the clicked button (keyboard clicks have detail 0 and keep focus)
    if (e.detail > 0 && btn.getAttribute('data-act') !== 'close') dex.focus({ preventScroll: true });
    if (btn.hasAttribute('data-digit')) run('digit', btn.getAttribute('data-digit'));
    else if (btn.getAttribute('data-act')) run(btn.getAttribute('data-act'));
  });

  var KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
               Enter: 'go', Backspace: 'clear', r: 'random', R: 'random', Escape: 'close' };

  dex.addEventListener('keydown', function (e) {
    // Enter/Space on a focused button already clicks it
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('button')) return;
    if (/^[0-9]$/.test(e.key)) { run('digit', e.key); e.preventDefault(); return; }
    var act = KEYS[e.key];
    if (act) { run(act); e.preventDefault(); }
  });

  /* ---- Open / close -------------------------------------------------- */
  var opened = false;

  function open() {
    dex.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', 'Close Pokédex');
    requestAnimationFrame(function () { dex.classList.add('is-open'); });
    dex.focus();
    load().then(function () {
      if (!pool) return;
      if (!opened) { opened = true; if (!showId(partnerId())) render(); }
    });
  }

  function close() {
    dex.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Open Pokédex');
    if (motionOK) {
      setTimeout(function () { if (!dex.classList.contains('is-open')) dex.hidden = true; }, 220);
    } else {
      dex.hidden = true;
    }
    launcher.focus();
  }

  launcher.addEventListener('click', function () {
    if (dex.hidden || !dex.classList.contains('is-open')) open(); else close();
  });
}());
