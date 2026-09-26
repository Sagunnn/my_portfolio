/* Sagun B. Pradhan — hero pet
   A soot sprite that wanders along the bottom of the hero. Click it to pet it.
   Sprite sheet from derdere/site-pet (GPL-3.0): https://github.com/derdere/site-pet
   Sheet layout: 8 frames × 9 rows of 64px — idle ×3, right, down, left, up, pet, sleep. */

(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ROW = { IDLE1: 0, IDLE2: 1, IDLE3: 2, RIGHT: 3, LEFT: 5, PET: 7, SLEEP: 8 };
  var SIZE = 64;
  var FRAMES = 8;
  var STEP = 48;      // px walked per animation cycle
  var TICK = 150;     // ms per frame

  var pet = document.createElement('div');
  pet.className = 'pet';
  pet.setAttribute('aria-hidden', 'true');
  pet.title = 'Pet me';
  hero.appendChild(pet);

  var row = ROW.IDLE1;
  var frame = 0;
  var sleep = 0;
  var moving = false;
  var x = Math.round(hero.clientWidth * 0.15);

  function maxX() { return Math.max(0, hero.clientWidth - SIZE); }
  function place() { pet.style.transform = 'translateX(' + x + 'px)'; }
  function rand(n) { return Math.floor(Math.random() * n); }
  function setRow(r) { row = r; frame = 0; }

  function nextCycle() {
    if (sleep > 0) {
      sleep -= 1;
      moving = false;
      setRow(ROW.SLEEP);
      return;
    }

    var roll = rand(10);
    moving = false;

    if (roll < 4) {
      setRow([ROW.IDLE1, ROW.IDLE1, ROW.IDLE2, ROW.IDLE3][rand(4)]);
    } else if (roll < 9) {
      var dir = rand(2) ? 1 : -1;
      if (x <= 0) dir = 1;
      if (x >= maxX()) dir = -1;
      x = Math.min(maxX(), Math.max(0, x + dir * STEP));
      moving = true;
      place();
      setRow(dir > 0 ? ROW.RIGHT : ROW.LEFT);
    } else {
      sleep = 5;
      setRow(ROW.SLEEP);
    }
  }

  function tick() {
    if (document.hidden) return;
    pet.style.backgroundPosition = (-SIZE * frame) + 'px ' + (-SIZE * row) + 'px';
    frame += 1;
    if (frame >= FRAMES) nextCycle();
    pet.classList.toggle('is-pettable', !moving && sleep <= 0 && row !== ROW.PET);
  }

  pet.addEventListener('click', function () {
    if (!moving && sleep <= 0 && row !== ROW.PET) setRow(ROW.PET);
  });

  window.addEventListener('resize', function () {
    if (x > maxX()) { x = maxX(); place(); }
  });

  place();
  setInterval(tick, TICK);
}());
