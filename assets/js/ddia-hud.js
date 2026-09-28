/* Sagun B. Pradhan — DDIA progress HUD
   A Pokémon battle-style HP bar that fills as chapters are read.
   Renders into every [data-ddia-hud] element; add data-variant="compact" for the small one.
   Pokémon names and sprites come from PokeAPI via scripts/fetch_pokemon.py — nothing is
   requested from PokeAPI at runtime. */

(function () {
  'use strict';

  var huds = document.querySelectorAll('[data-ddia-hud]');
  if (!huds.length) return;

  /* ---- Progress comes from the page -----------------------------------
     The build writes it onto each [data-ddia-hud]:
       data-read  — chapter pages published (the Pokémon's level)
       data-total — chapters in the book
       data-exp   — how far into the next chapter, 0–100 (the blue EXP bar),
                    set in src/_data/ddia.json */
  var src = huds[0].dataset;
  var DDIA = {
    read: parseInt(src.read, 10) || 0,
    total: parseInt(src.total, 10) || 14,
    exp: parseFloat(src.exp) || 0
  };

  // resolve assets/ relative to this script, so the HUD works at any page depth
  var script = document.currentScript || document.querySelector('script[src*="ddia-hud.js"]');
  var ASSETS = script.src.replace(/js\/ddia-hud\.js.*$/, '');
  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var pct = Math.round((DDIA.read / DDIA.total) * 100);
  // Pokémon HP colours: green above half, yellow above a fifth, red below
  var tone = pct > 50 ? 'high' : pct > 20 ? 'mid' : 'low';
  var done = DDIA.read >= DDIA.total;
  var exp = done ? 100 : Math.max(0, Math.min(100, Math.round(DDIA.exp)));
  var next = done
    ? 'Book complete!'
    : exp > 0
      ? 'Ch ' + (DDIA.read + 1) + ' · ' + exp + '% read'
      : 'Next up: Chapter ' + (DDIA.read + 1);

  // "LEVEL UP!" the first time a returning visitor sees a higher level
  var levelledUp = false;
  try {
    var seen = parseInt(localStorage.getItem('ddia-level'), 10);
    levelledUp = seen > 0 && DDIA.read > seen;
    localStorage.setItem('ddia-level', String(DDIA.read));
  } catch (e) { /* storage blocked — skip the celebration */ }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function render(hud, pool) {
    hud.textContent = '';
    hud.classList.add('hud', 'hud--' + tone);

    var box = el('div', 'hud__box');
    var top = el('div', 'hud__top');
    var name = el('span', 'hud__name', 'MISSINGNO.');
    var lv = el('span', 'hud__lv', 'Lv');
    lv.appendChild(el('b', null, String(DDIA.read)));
    top.appendChild(name);
    top.appendChild(lv);

    var hp = el('div', 'hud__hp');
    hp.appendChild(el('span', 'hud__hp-label', 'HP'));
    var track = el('span', 'hud__track');
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-label', 'DDIA chapters read');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', String(DDIA.total));
    track.setAttribute('aria-valuenow', String(DDIA.read));
    track.setAttribute('aria-valuetext', DDIA.read + ' of ' + DDIA.total + ' chapters');
    var fill = el('span', 'hud__fill');
    fill.style.width = motionOK ? '0%' : pct + '%';
    track.appendChild(fill);
    hp.appendChild(track);

    var xp = el('div', 'hud__xp');
    xp.appendChild(el('span', 'hud__xp-label', 'EXP'));
    var xpTrack = el('span', 'hud__xp-track');
    xpTrack.setAttribute('role', 'progressbar');
    xpTrack.setAttribute('aria-label', done ? 'Book complete' : 'Progress through chapter ' + (DDIA.read + 1));
    xpTrack.setAttribute('aria-valuemin', '0');
    xpTrack.setAttribute('aria-valuemax', '100');
    xpTrack.setAttribute('aria-valuenow', String(exp));
    var xpFill = el('span', 'hud__xp-fill');
    xpFill.style.width = motionOK ? '0%' : exp + '%';
    xpTrack.appendChild(xpFill);
    xp.appendChild(xpTrack);

    var foot = el('div', 'hud__foot');
    foot.appendChild(el('span', 'hud__next', next));
    foot.appendChild(el('span', 'hud__count', DDIA.read + '/ ' + DDIA.total));

    box.appendChild(top);
    box.appendChild(hp);
    box.appendChild(xp);
    box.appendChild(foot);
    if (levelledUp) {
      box.appendChild(el('span', 'hud__levelup', 'LEVEL UP!'));
      hud.classList.add('is-levelup');
    }

    // inside a link (the home page card) a nested button would be invalid, so no reroll there
    var reroll = !hud.closest('a');
    var mon = el(reroll ? 'button' : 'span', 'hud__mon');
    if (reroll) mon.type = 'button';
    var img = el('img');
    img.width = 96;
    img.height = 96;
    img.alt = '';
    mon.appendChild(img);

    hud.appendChild(box);
    hud.appendChild(mon);

    function pick() {
      if (!pool.length) { mon.hidden = true; return; }
      var p = pool[Math.floor(Math.random() * pool.length)];
      name.textContent = p.name.toUpperCase();
      img.src = ASSETS + 'img/pokemon/' + p.id + '.png';
      // the Pokédex's yellow button jumps to this Pokémon
      document.documentElement.setAttribute('data-ddia-partner', String(p.id));
      if (reroll) {
        mon.setAttribute('aria-label', p.name + ' — show another Pokémon');
        mon.title = 'Show another Pokémon';
      }
    }

    if (reroll) mon.addEventListener('click', pick);
    pick();

    if (motionOK) {
      // let the empty bar paint first, then fill it
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          fill.style.width = pct + '%';
          xpFill.style.width = exp + '%';
        });
      });
    }
  }

  function start(pool) {
    Array.prototype.forEach.call(huds, function (hud) { render(hud, pool); });
  }

  fetch(ASSETS + 'data/pokemon.json')
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(start, function () { start([]); });
}());
