/* =========================================================
   ATLAS X — interactions
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function cssVar(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  /* ---------- Thème ---------- */
  var toggle = document.getElementById('themeToggle');

  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('atlasx-theme', t); } catch (e) {}
    sky.refreshColors();
  }

  toggle.addEventListener('click', function (ev) {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

    if (!document.startViewTransition || reduceMotion) {
      applyTheme(next);
      return;
    }

    // Révélation circulaire depuis le bouton
    var r = toggle.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    var vt = document.startViewTransition(function () { applyTheme(next); });
    vt.ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 700, easing: 'cubic-bezier(.2,.7,.1,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });

  /* ---------- Ciel étoilé ---------- */
  var sky = (function () {
    var canvas = document.getElementById('sky');
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, stars = [], shooting = [], colors = {};
    var mouse = { x: -9999, y: -9999, tx: 0, ty: 0, px: 0, py: 0 };
    var scrollY = window.scrollY;

    function refreshColors() {
      var light = root.getAttribute('data-theme') === 'light';
      colors = {
        light: light,
        star: light ? '20,22,50' : '235,240,255',
        accents: [cssVar('--cyan'), cssVar('--violet'), cssVar('--magenta')],
        line: light ? 'rgba(106,60,242,' : 'rgba(144,160,255,'
      };
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(260, Math.round((w * h) / 6500));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * 0.9 + 0.1,          // profondeur (parallaxe)
          r: Math.random() * 1.2 + 0.25,
          tw: Math.random() * Math.PI * 2,         // phase de scintillement
          ts: 0.005 + Math.random() * 0.02,
          accent: Math.random() < 0.07 ? Math.floor(Math.random() * 3) : -1
        });
      }
    }

    function spawnShooting() {
      if (reduceMotion || shooting.length > 1) return;
      shooting.push({
        x: Math.random() * w * 0.8 + w * 0.2,
        y: Math.random() * h * 0.4,
        vx: -(6 + Math.random() * 4),
        vy: 2.5 + Math.random() * 2,
        life: 1
      });
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      mouse.px += (mouse.tx - mouse.px) * 0.05;
      mouse.py += (mouse.ty - mouse.py) * 0.05;
      var sy = window.scrollY;

      var near = [];
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.tw += s.ts;
        var x = s.x + mouse.px * s.z * 18;
        var y = ((s.y - sy * s.z * 0.15) % h + h) % h + mouse.py * s.z * 18;
        var a = (0.35 + Math.sin(s.tw) * 0.35 + 0.3) * (colors.light ? 0.55 : 1);
        ctx.beginPath();
        ctx.arc(x, y, s.r * (colors.light ? 0.9 : 1), 0, Math.PI * 2);
        if (s.accent >= 0) {
          ctx.fillStyle = colors.accents[s.accent];
          ctx.globalAlpha = Math.min(1, a + 0.2);
          ctx.shadowBlur = 8;
          ctx.shadowColor = colors.accents[s.accent];
        } else {
          ctx.fillStyle = 'rgba(' + colors.star + ',' + a.toFixed(3) + ')';
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
        ctx.fill();

        // constellation autour du curseur
        var dx = x - mouse.x, dy = y - mouse.y;
        if (dx * dx + dy * dy < 160 * 160) near.push([x, y]);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      for (var j = 0; j < near.length; j++) {
        for (var k = j + 1; k < near.length; k++) {
          var ddx = near[j][0] - near[k][0], ddy = near[j][1] - near[k][1];
          var d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 90) {
            ctx.strokeStyle = colors.line + (0.35 * (1 - d / 90)).toFixed(3) + ')';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(near[j][0], near[j][1]);
            ctx.lineTo(near[k][0], near[k][1]);
            ctx.stroke();
          }
        }
      }

      // étoiles filantes
      for (var m = shooting.length - 1; m >= 0; m--) {
        var st = shooting[m];
        st.x += st.vx; st.y += st.vy; st.life -= 0.012;
        var g = ctx.createLinearGradient(st.x, st.y, st.x - st.vx * 14, st.y - st.vy * 14);
        g.addColorStop(0, 'rgba(' + colors.star + ',' + Math.max(0, st.life) + ')');
        g.addColorStop(1, 'rgba(' + colors.star + ',0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(st.x - st.vx * 14, st.y - st.vy * 14);
        ctx.stroke();
        if (st.life <= 0) shooting.splice(m, 1);
      }

      if (!reduceMotion) requestAnimationFrame(frame);
    }

    window.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.tx = (e.clientX / w - 0.5);
      mouse.ty = (e.clientY / h - 0.5);
    }, { passive: true });
    window.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(resize, 150);
    });

    refreshColors();
    resize();
    frame();
    if (!reduceMotion) setInterval(function () { if (Math.random() < 0.6) spawnShooting(); }, 4200);

    return { refreshColors: refreshColors };
  })();

  /* ---------- Système orbital (hero) ---------- */
  (function () {
    var orbit = document.getElementById('orbit');
    var ringsG = document.getElementById('orbitRings');
    var sats = Array.prototype.slice.call(orbit.querySelectorAll('.sat'));
    var NS = 'http://www.w3.org/2000/svg';
    var TILT = -14 * Math.PI / 180;

    // a, b : demi-axes (en fraction de la taille), v : vitesse, t : phase
    var orbits = [
      { a: 0.25, b: 0.11, v: 0.0042, t: 0.4 },
      { a: 0.32, b: 0.15, v: -0.0031, t: 2.3 },
      { a: 0.39, b: 0.19, v: 0.0024, t: 4.1 },
      { a: 0.45, b: 0.235, v: -0.0019, t: 1.2 },
      { a: 0.495, b: 0.28, v: 0.0015, t: 5.4 }
    ];

    orbits.forEach(function (o, i) {
      var e = document.createElementNS(NS, 'ellipse');
      e.setAttribute('cx', 300); e.setAttribute('cy', 300);
      e.setAttribute('rx', o.a * 600); e.setAttribute('ry', o.b * 600);
      e.setAttribute('transform', 'rotate(' + (TILT * 180 / Math.PI) + ' 300 300)');
      ringsG.appendChild(e);
      if (i % 2 === 0) {
        var g = e.cloneNode();
        g.setAttribute('class', 'glow');
        ringsG.appendChild(g);
      }
    });

    var paused = false;
    sats.forEach(function (s) {
      s.addEventListener('pointerenter', function () { paused = true; });
      s.addEventListener('pointerleave', function () { paused = false; });
      s.addEventListener('focus', function () { paused = true; });
      s.addEventListener('blur', function () { paused = false; });
    });

    var size = orbit.clientWidth;
    if (window.ResizeObserver) {
      new ResizeObserver(function () { size = orbit.clientWidth; }).observe(orbit);
    } else {
      window.addEventListener('resize', function () { size = orbit.clientWidth; });
    }

    var cos = Math.cos(TILT), sin = Math.sin(TILT);
    function place() {
      for (var i = 0; i < sats.length; i++) {
        var o = orbits[i];
        if (!paused && !reduceMotion) o.t += o.v;
        var ex = Math.cos(o.t) * o.a * size;
        var ey = Math.sin(o.t) * o.b * size;
        var x = size / 2 + ex * cos - ey * sin;
        var y = size / 2 + ex * sin + ey * cos;
        var depth = Math.sin(o.t);                    // -1 derrière, +1 devant
        var scale = 0.82 + (depth + 1) * 0.12;
        var el = sats[i];
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) scale(' + scale.toFixed(3) + ')';
        el.style.zIndex = depth > -0.15 ? 20 : 5;
        el.style.opacity = (0.55 + (depth + 1) * 0.225).toFixed(3);
      }
      requestAnimationFrame(place);
    }
    place();
  })();

  /* ---------- Navigation ---------- */
  var nav = document.getElementById('nav');
  var bar = document.querySelector('.progress span');
  var timeline = document.getElementById('timeline');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));

  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 30);
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

    // remplissage de la timeline
    var r = timeline.getBoundingClientRect();
    var p = (innerHeight * 0.6 - r.top) / r.height;
    p = Math.max(0, Math.min(1, p));
    timeline.style.setProperty('--fill', p.toFixed(4));
    steps.forEach(function (s) {
      var sr = s.getBoundingClientRect();
      s.classList.toggle('lit', sr.top + 40 < innerHeight * 0.6);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // lien actif
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sectionObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id); });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['systeme', 'talos', 'vol', 'faq'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) sectionObs.observe(el);
  });

  /* ---------- Menu mobile ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('open'); });
    } else {
      menu.classList.remove('open');
      setTimeout(function () { if (!menu.classList.contains('open')) menu.hidden = true; }, 350);
    }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Apparitions au scroll ---------- */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        revealObs.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function (el, i) {
    // léger décalage pour les éléments d'une même grille
    var parent = el.parentElement;
    if (parent && (parent.classList.contains('cards') || parent.classList.contains('faq') || parent.classList.contains('timeline'))) {
      var idx = Array.prototype.indexOf.call(parent.children, el);
      el.style.transitionDelay = (idx % 3) * 0.08 + 's';
    }
    revealObs.observe(el);
  });

  /* ---------- Lumière qui suit le curseur sur les cartes ---------- */
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--x', (e.clientX - r.left) + 'px');
      card.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Boutons magnétiques ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.25) + 'px');
        btn.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.35) + 'px');
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  /* ---------- Console : simulation d'une mission ---------- */
  (function () {
    var body = document.getElementById('consoleBody');
    var lines = [
      ['08:02', '<span class="who" style="color:var(--text)">☎ Appel entrant</span> — M. Durand, fuite sous l\'évier'],
      ['08:02', '<span class="who" style="color:var(--magenta)">TALOS·accueil</span> › urgence moyenne, secteur Lyon 3e'],
      ['08:03', '<span class="who" style="color:var(--cyan)">ASTROLABE</span> › devis n° 2026-114 généré'],
      ['08:03', '<span class="who" style="color:var(--gold)">RELAIS</span> › devis envoyé par SMS et e-mail'],
      ['08:41', '<span class="ok">✓ Devis signé électroniquement</span>'],
      ['08:41', '<span class="who" style="color:var(--gold)">RELAIS</span> › intervention jeudi 9 h, agenda mis à jour'],
      ['08:42', '<span class="who" style="color:var(--violet)">SIGNAL</span> › demande d\'avis Google programmée (J+1)'],
      ['', '<span class="ok">Mission accomplie.</span> Temps passé par vous : 1 pouce levé. <span class="caret"></span>']
    ];
    var started = false;

    function run() {
      body.innerHTML = '';
      lines.forEach(function (l, i) {
        setTimeout(function () {
          var li = document.createElement('li');
          if (!l[0]) li.className = 'end';
          li.innerHTML = (l[0] ? '<time>' + l[0] + '</time>' : '') + '<span>' + l[1] + '</span>';
          body.appendChild(li);
        }, reduceMotion ? 0 : i * 900);
      });
      if (!reduceMotion) setTimeout(run, lines.length * 900 + 5000);
    }

    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting && !started) {
        started = true;
        run();
        obs.disconnect();
      }
    }, { threshold: 0.3 }).observe(document.getElementById('console'));
  })();

  /* ---------- Compteurs ---------- */
  var countObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      var target = +el.dataset.count;
      var suffix = el.dataset.suffix || '';
      var start = performance.now();
      var dur = reduceMotion ? 0 : 1400;
      (function tick(now) {
        var p = dur ? Math.min(1, (now - start) / dur) : 1;
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
      countObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { countObs.observe(el); });

  /* ---------- Compte à rebours du CTA ---------- */
  (function () {
    var cd = document.getElementById('countdown');
    var span = cd.querySelector('span');
    var done = false;
    new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || done) return;
      done = true;
      var n = 10;
      var iv = setInterval(function () {
        n--;
        if (n <= 0) {
          clearInterval(iv);
          cd.innerHTML = 'Décollage ✦';
          return;
        }
        span.textContent = n < 10 ? '0' + n : n;
      }, reduceMotion ? 1 : 260);
    }, { threshold: 0.6 }).observe(cd);
  })();
})();
