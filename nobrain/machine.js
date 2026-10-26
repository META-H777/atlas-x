/* NoBrain — Fig. 3 : la machine (boucle 3D)
   Les demandes entrent à gauche, la machine les traite, elles ressortent
   en rouge, « faites », et s'empilent. Jour et nuit. */

const fig = document.getElementById('machine');
const stage = document.getElementById('machineStage');
const clockEl = document.getElementById('machineClock');
const doneEl = document.getElementById('machineDone');
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ce qui entre, ce qui sort
const JOBS = [
  ['Appel manqué', '8 h 02, sur le chantier', 'Client rappelé', 'RDV jeudi 9 h'],
  ['Demande de devis', 'Salle de bain complète', 'Devis envoyé', 'À votre en-tête'],
  ['Nouvel avis Google', '★★★★★ Mme Durand', 'Avis répondu', 'Merci Mme Durand'],
  ['Facture à faire', 'Chantier Martin', 'Facture envoyée', 'Relance prévue J+7'],
  ['Site pas à jour', '12 photos de chantier', 'Site mis à jour', '3 réalisations en ligne'],
  ['Poster sur Insta ?', 'Avant / après cuisine', 'Post publié', 'Mardi, 18 h'],
  ['Message à 22 h', '« Vous êtes dispo ? »', 'Réponse envoyée', 'Créneau proposé'],
  ['Devis sans réponse', 'Envoyé le 12', 'Client relancé', 'Il a signé'],
  ['On me trouve ?', 'Google, ChatGPT…', 'Vous ressortez', 'Fiche + site optimisés']
];

function pad(n) { return (n < 10 ? '0' : '') + n; }
function tickClock() {
  const d = new Date();
  clockEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
}
tickClock();
setInterval(tickClock, 15000);

// Chargement paresseux : Three.js n'est chargé qu'à l'approche de la section
let started = false;
function boot() {
  if (started) return;
  started = true;
  Promise.all([
    import('./vendor/three.module.min.js'),
    document.fonts ? document.fonts.load('800 64px "Inter Tight"').catch(() => {}) : Promise.resolve()
  ]).then(([THREE]) => run(THREE)).catch(() => { /* sans WebGL : le texte de repli reste affiché */ });
}
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((en) => {
    if (en.some((e) => e.isIntersecting)) { io.disconnect(); boot(); }
  }, { rootMargin: '900px 0px' });
  io.observe(fig);
} else boot();

function run(THREE) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.appendChild(renderer.domElement);
  fig.classList.add('ready');

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 200);
  scene.add(new THREE.AmbientLight(0xffffff, .9));
  const sun = new THREE.DirectionalLight(0xffffff, .55);
  sun.position.set(-4, 10, 7);
  scene.add(sun);

  // ---------- Couleurs (suivent le thème du site) ----------
  const C = {};
  function readColors() {
    const cs = getComputedStyle(root);
    C.bg = cs.getPropertyValue('--ink').trim();      // fond du bandeau
    C.fg = cs.getPropertyValue('--paper').trim();    // machine, cartes entrantes
    C.red = cs.getPropertyValue('--red').trim();
    const a = new THREE.Color(C.bg), b = new THREE.Color(C.fg);
    C.belt = '#' + a.clone().lerp(b, .14).getHexString();
    C.beltSide = '#' + a.clone().lerp(b, .08).getHexString();
    C.grid = '#' + a.clone().lerp(b, .2).getHexString();
  }
  readColors();

  const FONT = '"Inter Tight", "Helvetica Neue", Arial, sans-serif';
  const MONO = '"IBM Plex Mono", ui-monospace, monospace';

  // ---------- Textures dessinées ----------
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.userData.canvas = c; t.userData.draw = draw;
    return t;
  }
  function redraw(t) {
    const c = t.userData.canvas, g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    t.userData.draw(g, c.width, c.height);
    t.needsUpdate = true;
  }

  function cardDraw(job, done) {
    return (g, w, h) => {
      g.fillStyle = done ? C.red : C.fg; g.fillRect(0, 0, w, h);
      const ink = done ? '#ffffff' : C.bg;
      g.fillStyle = ink; g.strokeStyle = ink;
      g.font = '500 30px ' + MONO;
      g.textBaseline = 'top';
      g.globalAlpha = .75;
      g.fillText(done ? 'FAIT' : 'À FAIRE', 34, 30);
      g.globalAlpha = 1;
      // pastille : vide (à faire) ou cochée (fait)
      g.lineWidth = 5;
      g.beginPath(); g.arc(w - 52, 48, 20, 0, Math.PI * 2);
      if (done) { g.fill(); g.strokeStyle = C.red; g.beginPath(); g.moveTo(w - 62, 48); g.lineTo(w - 54, 57); g.lineTo(w - 40, 38); g.stroke(); }
      else g.stroke();
      g.fillStyle = ink;
      fitText(g, done ? job[2] : job[0], 34, 118, w - 68, 800, 64, FONT);
      g.globalAlpha = .8;
      fitText(g, done ? job[3] : job[1], 34, 200, w - 68, 500, 38, FONT);
      g.globalAlpha = 1;
      g.fillRect(34, h - 40, w - 68, 4);
    };
  }
  function fitText(g, txt, x, y, max, weight, size, family) {
    let px = size;
    g.font = weight + ' ' + px + 'px ' + family;
    while (g.measureText(txt).width > max && px > 20) { px -= 2; g.font = weight + ' ' + px + 'px ' + family; }
    g.fillText(txt, x, y);
  }

  // écran de la machine : ce qu'elle traite en ce moment
  const screen = { title: 'En attente', p: 0, n: 0 };
  function screenDraw(g, w, h) {
    g.fillStyle = C.fg; g.fillRect(0, 0, w, h);
    // logo
    g.fillStyle = C.bg; g.textBaseline = 'alphabetic';
    g.font = '800 96px ' + FONT;
    const no = g.measureText('no').width, br = g.measureText('brain').width;
    g.fillText('no', 44, 150); g.fillText('brain', 44 + no, 150);
    g.fillStyle = C.red;
    g.fillRect(40 + no, 118, br + 8, 11);
    g.fillText('.', 44 + no + br, 150);
    // panneau
    g.fillStyle = C.bg;
    g.fillRect(44, 205, w - 88, 3);
    g.font = '500 30px ' + MONO; g.globalAlpha = .7;
    g.fillText('EN COURS', 44, 268);
    g.textAlign = 'right'; g.fillText('N° ' + String(screen.n).padStart(4, '0'), w - 44, 268); g.textAlign = 'left';
    g.globalAlpha = 1;
    g.font = '800 58px ' + FONT;
    g.fillText(screen.title, 44, 345, w - 88);
    // barre de progression
    g.globalAlpha = .18; g.fillRect(44, 385, w - 88, 26); g.globalAlpha = 1;
    g.fillStyle = C.red; g.fillRect(44, 385, (w - 88) * screen.p, 26);
    g.fillStyle = C.bg; g.font = '500 28px ' + MONO; g.globalAlpha = .7;
    g.fillText('JOUR ET NUIT', 44, 470);
    g.textAlign = 'right'; g.fillText(Math.round(screen.p * 100) + ' %', w - 44, 470); g.textAlign = 'left';
    g.globalAlpha = 1;
  }

  function beltDraw(g, w, h) {
    g.fillStyle = C.belt; g.fillRect(0, 0, w, h);
    g.fillStyle = C.fg; g.globalAlpha = .22;
    for (let i = 0; i < 8; i++) g.fillRect(i * (w / 8), 0, 6, h);
    g.globalAlpha = 1;
  }

  // ---------- Décor ----------
  const BELT_TOP = .55, BELT_Z = 0;
  const X_START = -5.6, X_END = 3.85, X_PILE = 5.35;
  const MW = 3.1, MH = 3.2, MD = 2.9;           // machine
  const CW = 2.1, CH = 1.35, CD = .1;           // cartes

  const mats = {
    fg: new THREE.MeshLambertMaterial(),
    red: new THREE.MeshLambertMaterial(),
    bg: new THREE.MeshBasicMaterial(),
    beltSide: new THREE.MeshLambertMaterial(),
    edge: new THREE.LineBasicMaterial({ transparent: true, opacity: .9 }),
    edgeSoft: new THREE.LineBasicMaterial({ transparent: true, opacity: .35 })
  };
  function paintMats() {
    mats.fg.color.set(C.fg); mats.red.color.set(C.red); mats.bg.color.set(C.bg);
    mats.beltSide.color.set(C.beltSide); mats.edge.color.set(C.bg); mats.edgeSoft.color.set(C.fg);
  }
  paintMats();

  function edges(mesh, mat) {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), mat || mats.edge);
    mesh.add(l); return l;
  }

  const world = new THREE.Group();
  scene.add(world);

  // sol : grille technique
  const grid = new THREE.GridHelper(40, 40);
  grid.material.transparent = true; grid.material.opacity = .5;
  world.add(grid);

  // tapis
  const beltTex = canvasTex(512, 64, beltDraw);
  beltTex.wrapS = THREE.RepeatWrapping; beltTex.repeat.set(6, 1);
  const beltLen = X_END - X_START + 1.6;
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(beltLen, BELT_TOP, 1.7),
    [mats.beltSide, mats.beltSide, new THREE.MeshLambertMaterial({ map: beltTex }), mats.beltSide, mats.beltSide, mats.beltSide]
  );
  belt.position.set((X_START + X_END) / 2 + .2, BELT_TOP / 2, BELT_Z);
  edges(belt, mats.edgeSoft);
  world.add(belt);

  // machine
  const screenTex = canvasTex(600, 620, screenDraw);
  const machine = new THREE.Mesh(
    new THREE.BoxGeometry(MW, MH, MD),
    [mats.fg, mats.fg, mats.fg, mats.fg, new THREE.MeshBasicMaterial({ map: screenTex }), mats.fg]
  );
  machine.position.set(0, MH / 2, 0);
  edges(machine);
  world.add(machine);
  // bouches d'entrée et de sortie
  [-1, 1].forEach((s) => {
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(1.9, CH + .45), mats.bg);
    mouth.position.set(s * (MW / 2 + .002), BELT_TOP + (CH + .45) / 2, 0);
    mouth.rotation.y = s * Math.PI / 2;
    world.add(mouth);
  });
  // voyant rouge
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(MW * .82, .07, .05), new THREE.MeshBasicMaterial());
  lamp.position.set(0, .28, MD / 2 + .03);
  world.add(lamp);

  // le « cerveau » : gyroscope qui tourne au-dessus
  const gyro = new THREE.Group();
  gyro.position.set(0, MH + 1.05, 0);
  gyro.scale.setScalar(1.3);
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(.72, .045, 12, 96), mats.red);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(.54, .04, 12, 96), mats.fg);
  const ringC = new THREE.Mesh(new THREE.TorusGeometry(.36, .035, 12, 96), mats.red);
  const core = new THREE.Mesh(new THREE.SphereGeometry(.17, 32, 16), mats.red);
  gyro.add(ringA, ringB, ringC, core);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .5, 12), mats.fg);
  mast.position.set(0, MH + .25, 0);
  world.add(gyro, mast);

  // plateau « fait »
  const tray = new THREE.Mesh(new THREE.BoxGeometry(CW + .5, .14, CH + .5), mats.beltSide);
  tray.position.set(X_PILE, .07, 0);
  edges(tray, mats.edgeSoft);
  world.add(tray);

  // ---------- Cartes ----------
  const cardGeo = new THREE.BoxGeometry(CW, CH, CD);
  const texCache = new Map();
  function tex(i, done) {
    const k = i + (done ? 'd' : 't');
    if (!texCache.has(k)) texCache.set(k, canvasTex(512, 330, cardDraw(JOBS[i], done)));
    return texCache.get(k);
  }
  function faceMats(i, done) {
    const side = done ? mats.red : mats.fg;
    const front = new THREE.MeshBasicMaterial({ map: tex(i, done) });
    return [side, side, side, side, front, side];
  }

  const cards = [];
  const pile = [];
  let jobIdx = 0, spawnT = 0, doneCount = 0;
  const SPEED = 1.15, GAP = 2.7;

  function spawn() {
    const i = jobIdx++ % JOBS.length;
    const m = new THREE.Mesh(cardGeo, faceMats(i, false));
    edges(m, mats.edge);
    m.position.set(X_START, BELT_TOP + CH / 2 + 4.5, BELT_Z);
    m.rotation.z = (Math.random() - .5) * .9;
    world.add(m);
    cards.push({ m, i, st: 'drop', t: 0, done: false, rz: m.rotation.z });
  }

  function easeOutBack(t) { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function easeInOut(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  let clearing = 0;
  function step(dt, t) {
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = GAP; }

    beltTex.offset.x -= dt * SPEED * beltTex.repeat.x / beltLen;

    let inside = null;
    for (let k = cards.length - 1; k >= 0; k--) {
      const c = cards[k], m = c.m;
      c.t += dt;
      if (c.st === 'drop') {
        const p = Math.min(1, c.t / .75);
        m.position.y = BELT_TOP + CH / 2 + 4.5 * (1 - easeOutBack(p));
        m.rotation.z = c.rz * (1 - p);
        m.position.x += SPEED * dt * p;
        if (p >= 1) { c.st = 'ride'; m.position.y = BELT_TOP + CH / 2; m.rotation.z = 0; }
      } else if (c.st === 'ride') {
        m.position.x += SPEED * dt;
        const x = m.position.x;
        if (Math.abs(x) < MW / 2 + CW / 2) {
          const p = (x + MW / 2 + CW / 2) / (MW + CW);
          if (!inside || Math.abs(x) < Math.abs(inside.c.m.position.x)) inside = { c, p };
        }
        if (!c.done && x > 0) {
          c.done = true;
          m.material[4].dispose();
          m.material = faceMats(c.i, true);
        }
        if (x >= X_END) { c.st = 'tip'; c.t = 0; c.from = m.position.clone(); }
      } else if (c.st === 'tip') {
        const p = Math.min(1, c.t / .7), e = easeInOut(p);
        const h = .14 + pile.length * CD + CD / 2;
        m.position.x = c.from.x + (X_PILE - c.from.x) * e;
        m.position.y = c.from.y + (h - c.from.y) * e + Math.sin(p * Math.PI) * .9;
        m.rotation.x = -Math.PI / 2 * e;
        m.rotation.y = (pile.length % 2 ? .05 : -.04) * e;
        if (p >= 1) {
          c.st = 'pile'; pile.push(c); cards.splice(k, 1);
          doneCount++; doneEl.textContent = doneCount;
          if (pile.length >= 7) clearing = .001;
        }
      }
    }

    // la pile s'envole quand elle est pleine
    if (clearing > 0) {
      clearing += dt;
      const p = Math.min(1, clearing / .9);
      pile.forEach((c, j) => {
        c.m.position.y += dt * (3 + j * .6);
        const s = Math.max(.001, 1 - p);
        c.m.scale.set(s, s, s);
      });
      if (p >= 1) {
        pile.forEach((c) => { world.remove(c.m); c.m.material[4].dispose(); });
        pile.length = 0; clearing = 0;
      }
    }

    // écran + voyant + gyroscope
    const busy = !!inside;
    const title = busy ? (inside.c.done ? JOBS[inside.c.i][2] : JOBS[inside.c.i][0]) : 'En attente';
    const prog = busy ? inside.p : 0;
    if (title !== screen.title || Math.abs(prog - screen.p) > .02) {
      if (title !== screen.title && busy) screen.n++;
      screen.title = title; screen.p = prog;
      redraw(screenTex);
    }
    lamp.material.color.set(busy ? C.red : C.beltSide);
    const spin = busy ? 2.4 : .8;
    ringA.rotation.x += dt * spin * .9;
    ringA.rotation.y += dt * spin * .4;
    ringB.rotation.y += dt * spin * 1.1;
    ringB.rotation.z += dt * spin * .3;
    ringC.rotation.x -= dt * spin * 1.4;
    core.scale.setScalar(1 + .12 * Math.sin(t * 4));
    gyro.position.y = MH + 1.05 + Math.sin(t * 1.3) * .08;
  }

  // ---------- Caméra ----------
  let viewW = 15;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    viewW = w < 520 ? 12.6 : 13;
    const viewH = viewW * h / w;
    camera.left = -viewW / 2; camera.right = viewW / 2;
    camera.top = viewH / 2; camera.bottom = -viewH / 2;
    camera.updateProjectionMatrix();
  }
  function placeCamera(t) {
    const az = -.42 + Math.sin(t * .11) * .1;
    const el = .5;
    const target = new THREE.Vector3(.15, 1.5, 0);
    camera.position.set(
      target.x + Math.sin(az) * Math.cos(el) * 40,
      target.y + Math.sin(el) * 40,
      target.z + Math.cos(az) * Math.cos(el) * 40
    );
    camera.lookAt(target);
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);

  // ---------- Thème ----------
  new MutationObserver(() => setTimeout(() => {
    readColors(); paintMats();
    grid.material.color.set(C.grid);
    texCache.forEach(redraw); redraw(screenTex); redraw(beltTex);
    if (!running) render(clock);
  }, 40)).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  grid.material.color.set(C.grid);

  // ---------- Boucle ----------
  let clock = 0, last = 0, running = false, visible = false, raf = 0;
  function render(t) { placeCamera(t); renderer.render(scene, camera); }
  function loop(now) {
    const dt = Math.min(.05, last ? (now - last) / 1000 : 0);
    last = now; clock += dt;
    step(dt, clock); render(clock);
    raf = (visible && !document.hidden) ? requestAnimationFrame(loop) : 0;
    running = !!raf;
  }
  function wake() {
    if (!raf && visible && !document.hidden && !reduceMotion) { last = 0; raf = requestAnimationFrame(loop); running = true; }
  }

  if (reduceMotion) {
    // une image fixe, en pleine activité
    for (let i = 0; i < 900; i++) { clock += 1 / 60; step(1 / 60, clock); }
    render(0);
    return;
  }
  // amorce : la machine tourne déjà quand on arrive
  for (let i = 0; i < 420; i++) { clock += 1 / 60; step(1 / 60, clock); }
  doneCount = 0; doneEl.textContent = '0';
  render(clock);

  new IntersectionObserver((en) => { visible = en[0].isIntersecting; wake(); }).observe(stage);
  document.addEventListener('visibilitychange', wake);
}
