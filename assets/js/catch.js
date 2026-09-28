/* Sagun B. Pradhan — the failed catch
   On the first home-page load of a browser session, a Poké Ball is thrown at the
   "Open to data engineering roles" badge, pulls it in, wobbles three times and bursts open:
   the badge breaks free, so it's still open to roles. Plays once per session, never loops,
   and is skipped for reduced motion. Uses the Web Animations API; the Poké Ball is the CSS
   one from style.css. */

(function () {
  'use strict';

  var badge = document.querySelector('.hero .status');
  if (!badge || !badge.animate) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    if (sessionStorage.getItem('catch-played')) return;
    sessionStorage.setItem('catch-played', '1');
  } catch (e) { /* storage blocked — play it, it's harmless */ }

  var stage = badge.parentNode;              // .hero .shell, position: relative
  var BALL = 28;

  var ball = document.createElement('span');
  ball.className = 'pokeball catch-ball';
  ball.setAttribute('aria-hidden', 'true');

  var msg = document.createElement('span');
  msg.className = 'catch-msg';
  msg.setAttribute('aria-hidden', 'true');
  msg.textContent = 'Oh no! It broke free!';

  function place() {
    var s = stage.getBoundingClientRect();
    var b = badge.getBoundingClientRect();
    var cx = b.left - s.left + b.width / 2;
    var cy = b.top - s.top + b.height / 2;
    ball.style.left = (cx - BALL / 2) + 'px';
    ball.style.top = (cy - BALL / 2) + 'px';
    msg.style.left = cx + 'px';
    msg.style.top = (b.top - s.top - 34) + 'px';
    return s.width;
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function done(anim) { return anim.finished; }

  function run() {
    stage.appendChild(ball);
    stage.appendChild(msg);
    var width = place();
    var dx = -Math.min(320, width / 2);     // thrown from the lower left

    // 1. the throw: an arc with a spin
    return done(ball.animate([
      { transform: 'translate(' + dx + 'px, 240px) rotate(-540deg)', opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { transform: 'translate(' + (dx * 0.45) + 'px, -70px) rotate(-220deg)', offset: 0.6 },
      { transform: 'translate(0, 0) rotate(0)' }
    ], { duration: 700, easing: 'cubic-bezier(0.3, 0.6, 0.4, 1)', fill: 'forwards' }))
      // 2. the badge flashes and is pulled into the ball, which hops
      .then(function () {
        badge.animate([
          { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)' },
          { transform: 'scale(1.05)', filter: 'brightness(2.5)', offset: 0.3 },
          { transform: 'scale(0)', opacity: 0, filter: 'brightness(2.5)' }
        ], { duration: 360, easing: 'ease-in', fill: 'forwards' });
        return done(ball.animate([
          { transform: 'translate(0, 0)' },
          { transform: 'translate(0, -20px)', offset: 0.5 },
          { transform: 'translate(0, 0)' }
        ], { duration: 420, easing: 'ease-in-out', fill: 'forwards' }));
      })
      .then(function () { return wait(250); })
      // 3. three wobbles on its base
      .then(function () {
        return done(ball.animate([
          { transform: 'rotate(0)' },
          { transform: 'rotate(-24deg)', offset: 0.08 },
          { transform: 'rotate(0)', offset: 0.16 },
          { transform: 'rotate(0)', offset: 0.33 },
          { transform: 'rotate(24deg)', offset: 0.41 },
          { transform: 'rotate(0)', offset: 0.49 },
          { transform: 'rotate(0)', offset: 0.66 },
          { transform: 'rotate(-24deg)', offset: 0.74 },
          { transform: 'rotate(0)', offset: 0.82 },
          { transform: 'rotate(0)' }
        ], { duration: 1900, easing: 'ease-in-out', fill: 'forwards' }));
      })
      // 4. it bursts open and the badge breaks free
      .then(function () {
        ball.animate([
          { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)' },
          { transform: 'scale(1.3)', opacity: 1, filter: 'brightness(3)', offset: 0.35 },
          { transform: 'scale(1.8)', opacity: 0, filter: 'brightness(3)' }
        ], { duration: 320, easing: 'ease-out', fill: 'forwards' });
        var out = badge.animate([
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.15)', opacity: 1, offset: 0.7 },
          { transform: 'scale(1)', opacity: 1 }
        ], { duration: 420, easing: 'ease-out', fill: 'forwards' });
        msg.animate([
          { transform: 'translate(-50%, 6px)', opacity: 0 },
          { transform: 'translate(-50%, 0)', opacity: 1, offset: 0.12 },
          { transform: 'translate(-50%, 0)', opacity: 1, offset: 0.8 },
          { transform: 'translate(-50%, -6px)', opacity: 0 }
        ], { duration: 2600, easing: 'ease-out', fill: 'forwards' });
        return done(out);
      })
      .then(function () { return wait(2400); })
      // 5. tidy up: drop the held animation states so the badge behaves normally again
      .then(function () {
        badge.getAnimations().forEach(function (a) { a.cancel(); });
        ball.remove();
        msg.remove();
      });
  }

  // start once fonts and layout have settled, so the ball lands on the badge
  var start = function () { setTimeout(run, 500); };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}());
