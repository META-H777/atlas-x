/* Nobrayn — interactions (sans dépendance) */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  // ---------- Thème clair / sombre ----------
  var themeBtn = document.getElementById('themeToggle');
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    var apply = function () { root.setAttribute('data-theme', next); store('nobrayn-theme', next); };
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply);
    else apply();
  });

  // ---------- Grille visible ----------
  var gridBtn = document.getElementById('gridToggle');
  function setGrid(on) {
    root.classList.toggle('show-grid', on);
    gridBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    store('nobrayn-grid', on ? '1' : '0');
  }
  if (read('nobrayn-grid') === '1') setGrid(true);
  gridBtn.addEventListener('click', function () { setGrid(!root.classList.contains('show-grid')); });
  document.addEventListener('keydown', function (e) {
    if (e.key && e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey &&
        !/input|textarea|select/i.test(document.activeElement.tagName)) {
      setGrid(!root.classList.contains('show-grid'));
    }
  });

  // ---------- Liste du hero : on raye tout, sauf le métier ----------
  var todo = document.getElementById('todo');
  var items = todo ? Array.prototype.slice.call(todo.querySelectorAll('li')) : [];
  var timers = [];
  function playTodo() {
    timers.forEach(clearTimeout); timers = [];
    items.forEach(function (li) { li.classList.remove('done', 'lit'); });
    var delay = reduceMotion ? 0 : 900;
    var step = reduceMotion ? 0 : 520;
    items.forEach(function (li, i) {
      timers.push(setTimeout(function () {
        li.classList.add(li.classList.contains('keep') ? 'lit' : 'done');
      }, delay + i * step));
    });
  }
  if (todo) {
    playTodo();
    document.getElementById('replay').addEventListener('click', playTodo);
  }

  // ---------- Compteur « En tête » + lignes rayées ----------
  var meter = document.getElementById('meter');
  var meterBox = meter.parentNode;
  var rows = Array.prototype.slice.call(document.querySelectorAll('#liste .row:not(.row-head)'));
  var total = rows.length;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function updateMeter() {
    var left = total - document.querySelectorAll('#liste .row.crossed').length;
    meter.textContent = pad(left);
    meterBox.classList.toggle('zero', left === 0);
  }

  if ('IntersectionObserver' in window) {
    var rowObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('crossed');
          rowObs.unobserve(en.target);
          updateMeter();
        }
      });
    }, { rootMargin: '0px 0px -38% 0px' });
    rows.forEach(function (r) { rowObs.observe(r); });

    // apparitions
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('.cloud, .ratio, .reveal').forEach(function (el) { revealObs.observe(el); });

    // nuage de tâches : apparition en cascade
    document.querySelectorAll('.cloud li').forEach(function (li, i) {
      li.style.transitionDelay = (reduceMotion ? 0 : i * 35) + 'ms';
    });

    // lien actif
    var links = document.querySelectorAll('.nav-links a');
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['liste', 'qui', 'methode', 'questions'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) secObs.observe(el);
    });
  } else {
    rows.forEach(function (r) { r.classList.add('crossed'); });
    document.querySelectorAll('.cloud, .ratio, .reveal').forEach(function (el) { el.classList.add('in'); });
    updateMeter();
  }

  // ---------- Menu mobile ----------
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('open'); });
    } else {
      menu.classList.remove('open');
      setTimeout(function () { if (!menu.classList.contains('open')) menu.hidden = true; }, 260);
    }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
})();
