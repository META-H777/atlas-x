/* NoBrain — interactions (sans dépendance) */
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
    var apply = function () { root.setAttribute('data-theme', next); store('nobrain-theme', next); };
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply);
    else apply();
  });

  // ---------- Grille visible ----------
  var gridBtn = document.getElementById('gridToggle');
  function setGrid(on) {
    root.classList.toggle('show-grid', on);
    gridBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    store('nobrain-grid', on ? '1' : '0');
  }
  if (read('nobrain-grid') === '1') setGrid(true);
  gridBtn.addEventListener('click', function () { setGrid(!root.classList.contains('show-grid')); });
  document.addEventListener('keydown', function (e) {
    if (e.key && e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey &&
        !/input|textarea|select/i.test(document.activeElement.tagName)) {
      setGrid(!root.classList.contains('show-grid'));
    }
  });

  // ---------- Liste du hero : on raye tout, sauf le métier ----------
  var todo = document.getElementById('todo');
  var items = Array.prototype.slice.call(todo.querySelectorAll('li'));
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
  playTodo();
  document.getElementById('replay').addEventListener('click', playTodo);

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

  // ---------- Fig. 3 : le système (désordre → grille) ----------
  (function () {
    var fig = document.getElementById('engine');
    var canvas = document.getElementById('engineCanvas');
    if (!fig || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var stateEl = document.getElementById('engineState');
    var orderEl = document.getElementById('engineOrder');

    var N = 7, CORE = 3;
    var W = 0, dpr = 1, cell = 0;
    var ink = '#fff', red = '#e30613';
    function readColors() {
      ink = getComputedStyle(fig).color;
      red = getComputedStyle(root).getPropertyValue('--red').trim() || red;
    }
    readColors();
    new MutationObserver(function () { setTimeout(readColors, 30); })
      .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    function rand(a, b) { return a + Math.random() * (b - a); }
    var dots = [];
    for (var gy = 0; gy < N; gy++) for (var gx = 0; gx < N; gx++) {
      if (gx === CORE && gy === CORE) continue;
      dots.push({
        gx: gx, gy: gy, x: 0, y: 0, ox: 0, oy: 0, vx: 0, vy: 0, flash: 0,
        cx: rand(.08, .92), cy: rand(.08, .92),
        ax: rand(.05, .14), ay: rand(.05, .14),
        fx: rand(.25, .7), fy: rand(.25, .7), px: rand(0, 6.3), py: rand(0, 6.3),
        delay: rand(0, .35)
      });
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(W * dpr);
      cell = W / N;
    }
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);

    function home(gx) { return (gx + .5) * cell; }
    function ease(t) { t = Math.max(0, Math.min(1, t)); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    // pointeur : on peut semer le désordre, le système le range aussitôt
    var mouse = { x: -1e4, y: -1e4, active: false };
    var stir = 0;
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    });
    canvas.addEventListener('pointerleave', function () { mouse.active = false; mouse.x = mouse.y = -1e4; });

    // cycle : désordre → tri → en ordre (avec envois), puis on recommence
    var phase = 'chaos', phaseT = 0, order = 0;
    var packets = [], rings = [], nextPacket = 0;
    var visible = false, last = 0, t = 0, raf = 0;

    function setState(txt) { if (stateEl.textContent !== txt) stateEl.textContent = txt; }

    function step(dt) {
      t += dt; phaseT += dt;
      if (phase === 'chaos' && phaseT > 2.2) { phase = 'sort'; phaseT = 0; }
      if (phase === 'sort') { order = ease(phaseT / 2.4); if (phaseT >= 2.4) { phase = 'order'; phaseT = 0; order = 1; } }
      if (phase === 'order' && phaseT > 14) { phase = 'unsort'; phaseT = 0; }
      if (phase === 'unsort') { order = 1 - ease(phaseT / 1.6); if (phaseT >= 1.6) { phase = 'chaos'; phaseT = 0; order = 0; } }

      stir = Math.max(0, stir - dt * 1.4);
      if (phase === 'chaos' || phase === 'unsort') setState('Désordre');
      else if (phase === 'sort') setState('Tri…');
      else setState(stir > .15 ? 'On range…' : 'En ordre');
      orderEl.textContent = Math.round(order * 100 * (1 - stir * .35));

      // envois du centre vers une tâche
      if (phase === 'order' && t > nextPacket) {
        var d = dots[Math.floor(Math.random() * dots.length)];
        packets.push({ d: d, p: 0, len: Math.abs(d.gx - CORE) + Math.abs(d.gy - CORE) });
        rings.push({ r: 0, a: 1 });
        nextPacket = t + rand(.35, .9);
      }
      packets = packets.filter(function (pk) {
        pk.p += dt / (.18 * pk.len + .25);
        if (pk.p >= 1) { pk.d.flash = 1; return false; }
        return true;
      });
      rings = rings.filter(function (rg) { rg.r += dt * cell * 1.6; rg.a -= dt * 1.4; return rg.a > 0; });

      var R = cell * 1.4;
      dots.forEach(function (d) {
        var o = ease((order - d.delay) / (1 - d.delay));
        if (phase === 'order') o = 1;
        var chx = (d.cx + Math.sin(t * d.fx + d.px) * d.ax) * W;
        var chy = (d.cy + Math.cos(t * d.fy + d.py) * d.ay) * W;
        // ressort autour de la position
        var dx = d.x - mouse.x, dy = d.y - mouse.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (mouse.active && dist < R && dist > .01) {
          var f = (1 - dist / R) * 900;
          d.vx += dx / dist * f * dt; d.vy += dy / dist * f * dt;
          if (order > .9) stir = Math.min(1, stir + dt * 2);
        }
        d.vx += -d.ox * 60 * dt; d.vy += -d.oy * 60 * dt;
        d.vx *= Math.pow(.02, dt); d.vy *= Math.pow(.02, dt);
        d.ox += d.vx * dt; d.oy += d.vy * dt;
        d.x = chx + (home(d.gx) - chx) * o + d.ox;
        d.y = chy + (home(d.gy) - chy) * o + d.oy;
        d.flash = Math.max(0, d.flash - dt * 1.2);
      });
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);
      var c = W / 2;

      // grille fine (apparaît avec l'ordre)
      ctx.strokeStyle = ink; ctx.lineWidth = 1;
      ctx.globalAlpha = .1 + .12 * order;
      ctx.strokeRect(.5, .5, W - 1, W - 1);
      ctx.globalAlpha = .13 * order;
      ctx.beginPath();
      for (var i = 0; i < N; i++) {
        var h = Math.round(home(i)) + .5;
        ctx.moveTo(h, cell * .5); ctx.lineTo(h, W - cell * .5);
        ctx.moveTo(cell * .5, h); ctx.lineTo(W - cell * .5, h);
      }
      ctx.stroke();

      // nœuds du désordre : tout est relié à tout
      var link = cell * 1.25, tangle = 1 - order;
      if (tangle > .01) {
        ctx.lineWidth = .8;
        for (var a = 0; a < dots.length; a++) for (var b = a + 1; b < dots.length; b++) {
          var p = dots[a], q = dots[b], dx = p.x - q.x, dy = p.y - q.y, dd = dx * dx + dy * dy;
          if (dd < link * link) {
            ctx.globalAlpha = (1 - Math.sqrt(dd) / link) * .45 * tangle;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }

      // envois (trajets en équerre, rouge)
      ctx.globalAlpha = 1;
      packets.forEach(function (pk) {
        var tx = home(pk.d.gx), ty = home(pk.d.gy);
        var lx = Math.abs(tx - c), ly = Math.abs(ty - c), L = lx + ly || 1, s = ease(pk.p) * L;
        var x = c, y = c;
        if (s <= lx) x = c + Math.sign(tx - c) * s;
        else { x = tx; y = c + Math.sign(ty - c) * (s - lx); }
        ctx.strokeStyle = red; ctx.lineWidth = 1.5; ctx.globalAlpha = .55;
        ctx.beginPath(); ctx.moveTo(c, c);
        if (s <= lx) ctx.lineTo(x, y); else { ctx.lineTo(tx, c); ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = red;
        ctx.fillRect(x - 3, y - 3, 6, 6);
      });

      // tâches : ronds en désordre, carrés une fois rangées, onde depuis le centre
      var base = Math.max(2.2, cell * .085);
      dots.forEach(function (d) {
        var dc = Math.hypot(d.gx - CORE, d.gy - CORE);
        var wave = Math.pow(Math.max(0, Math.cos(dc * 1.1 - t * 2.2)), 12) * order;
        var r = base * (1 + .5 * wave + 1.1 * d.flash);
        ctx.globalAlpha = .55 + .45 * Math.max(order, d.flash);
        ctx.fillStyle = d.flash > .02 ? red : ink;
        if (order > .5) {
          var k = (order - .5) * 2, rr = r * (1 - .12 * k);
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(d.x - rr, d.y - rr, rr * 2, rr * 2, rr * (1 - k));
          else ctx.rect(d.x - rr, d.y - rr, rr * 2, rr * 2);
          ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); ctx.fill();
        }
        if (d.flash > .02) { // coche discrète : tâche traitée
          ctx.globalAlpha = d.flash; ctx.strokeStyle = red; ctx.lineWidth = 1;
          ctx.strokeRect(d.x - r - 4, d.y - r - 4, (r + 4) * 2, (r + 4) * 2);
        }
      });

      // anneaux d'envoi
      ctx.strokeStyle = red; ctx.lineWidth = 1;
      rings.forEach(function (rg) {
        ctx.globalAlpha = rg.a * .6;
        ctx.beginPath(); ctx.arc(c, c, cell * .3 + rg.r, 0, Math.PI * 2); ctx.stroke();
      });

      // votre métier : le point rouge, immobile
      ctx.globalAlpha = 1; ctx.fillStyle = red;
      var core = cell * (.26 + .03 * Math.sin(t * 1.6));
      ctx.beginPath(); ctx.arc(c, c, core, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .9 * order; ctx.strokeStyle = red; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(c, c, cell * .42, 0, Math.PI * 2); ctx.stroke();
      // repères de visée
      ctx.globalAlpha = .5 * order; ctx.strokeStyle = ink;
      ctx.beginPath();
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (v) {
        ctx.moveTo(c + v[0] * cell * .5, c + v[1] * cell * .5);
        ctx.lineTo(c + v[0] * cell * .62, c + v[1] * cell * .62);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      step(dt); draw();
      raf = visible ? requestAnimationFrame(loop) : 0;
    }

    if (reduceMotion) {
      phase = 'order'; order = 1; step(0); draw();
      new MutationObserver(function () { setTimeout(function () { readColors(); draw(); }, 40); })
        .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
      return;
    }
    step(0); draw();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !raf) { last = 0; raf = requestAnimationFrame(loop); }
      }).observe(fig);
    } else { visible = true; raf = requestAnimationFrame(loop); }
  })();

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
