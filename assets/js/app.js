/* Sagun B. Pradhan — portfolio behaviour
   Mobile nav, scroll-spy, and reveal-on-scroll. No dependencies. */

(function () {
  'use strict';

  /* ---- Mobile nav -------------------------------------------------- */
  var toggle = document.querySelector('.nav__toggle');
  var tab = document.getElementById('nav-tab');

  if (toggle && tab) {
    toggle.addEventListener('click', function () {
      var open = tab.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    tab.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        tab.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- Scroll-spy --------------------------------------------------- */
  // in-page links only — subpages link back with "../../#work" etc.
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link[href^="#"]'));
  var sections = links
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---- Reveal on scroll --------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');
  var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!motionOK || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
    return;
  }

  var reveal = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  Array.prototype.forEach.call(revealables, function (el) { reveal.observe(el); });
}());
