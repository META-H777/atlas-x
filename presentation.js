/* Nobrayn — la présentation (32 s)
   Dessinée en direct dans un canvas et mise en musique avec Web Audio : aucun fichier vidéo à charger.
   Aperçu muet dans le hero, lecteur plein écran avec le son au clic. */
(function () {
'use strict';
const W = 1920, H = 1080;
const PAPER = '#f3f2ee', INK = '#0b0b0b', INK2 = '#4a4a47', RED = '#e30613', RED2 = '#ff3326', WHITE = '#ffffff';
let ctx = null;
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const eo = (x) => { x = cl(x); return 1 - Math.pow(1 - x, 3); };
const eio = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eb = (x) => { x = cl(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const pr = (t, a, d) => cl((t - a) / d);
const pad = (n) => (n < 10 ? '0' : '') + n;
function font(w, s, mono) { ctx.font = `${w} ${s}px ${mono ? '"IBM Plex Mono"' : '"Inter Tight"'}`; }
function txt(s, x, y, o = {}) {
  font(o.w || 500, o.s || 24, o.mono); ctx.fillStyle = o.c || INK; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
  const a = ctx.globalAlpha; if (o.a != null) ctx.globalAlpha = a * o.a;
  if (o.ls) { ctx.letterSpacing = o.ls + 'px'; }
  ctx.fillText(s, x, y);
  ctx.letterSpacing = '0px'; ctx.globalAlpha = a; ctx.textAlign = 'left';
}
function tw(s, w, sz, mono) { font(w, sz, mono); return ctx.measureText(s).width; }
function rr(x, y, w, h, r, fill, stroke, lw) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } }
function bg(c) { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); }
function grid(dark) {
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.045)' : 'rgba(11,11,11,0.05)';
  for (let i = 0; i <= 12; i++) ctx.fillRect(Math.round(80 + i * (1760 / 12)), 0, 1, H);
}
function chrome(dark, left, right, a = 1) {
  const c = dark ? 'rgba(243,242,238,0.6)' : INK2, line = dark ? 'rgba(243,242,238,0.22)' : 'rgba(11,11,11,0.6)';
  ctx.globalAlpha = a;
  txt(left, 80, 62, { mono: 1, s: 18, c, ls: 2 });
  txt(right, 1840, 62, { mono: 1, s: 18, c, ls: 2, align: 'right' });
  ctx.fillStyle = line; ctx.fillRect(80, 84, 1760, 2);
  ctx.fillRect(80, 1010, 1760, 1);
  txt('nobrayn.fr', 80, 1045, { mono: 1, s: 18, c, ls: 2 });
  txt('ARTISANS · TPE · PME', 1840, 1045, { mono: 1, s: 18, c, ls: 2, align: 'right' });
  ctx.globalAlpha = 1;
}
// révèle un texte par le bas, dans un masque
function reveal(s, x, y, p, o) {
  const sz = o.s; ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - sz * 1.02, W, sz * 1.3); ctx.clip();
  txt(s, x, y + (1 - p) * sz * 1.15, o); ctx.restore();
}
function panelFromLeft() {}
function panelToRight() {}
function panelFromBottom() {}
function card(x, y, w, h, p, o = {}) {
  // apparition d'une carte : glisse et se pose
  const k = eo(p); if (k <= 0) return false;
  ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 40);
  rr(x, y, w, h, o.r || 16, o.fill || WHITE, o.stroke === undefined ? INK : o.stroke, 2);
  return true;
}
function endCard() { ctx.restore(); }
function pill(s, x, y, p, filled) {
  const k = eb(p); if (p <= 0) return 0;
  const w = tw(s, 600, 26) + 44, h = 54;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.globalAlpha = cl(p * 3);
  rr(-w / 2, -h / 2, w, h, 27, filled ? INK : null, INK, 2);
  txt(s, 0, 9, { w: 600, s: 26, c: filled ? PAPER : INK, align: 'center' });
  ctx.restore(); return w;
}

/* ============ 1. La liste ============ */
const ITEMS = ['Mettre le site à jour', 'Répondre aux avis Google', 'Relancer le devis Martin', 'Poster quelque chose sur Insta', 'Rappeler le numéro de 8 h 02', 'Être trouvé sur ChatGPT ?', 'Faire les factures ce soir'];
function sListe(t) {
  bg(PAPER); grid(false); chrome(false, 'NOBRAYN — LE CATALOGUE', 'FIG. 1');
  txt("À PENSER AUJOURD'HUI", 160, 200, { mono: 1, s: 22, c: INK2, ls: 3, a: eo(pr(t, 0, 0.3)) });
  ctx.fillStyle = INK; ctx.fillRect(160, 222, 860 * eo(pr(t, 0, 0.5)), 3);
  let done = 0, lastDone = -9;
  ITEMS.forEach((it, i) => {
    const y = 300 + i * 76, a = eo(pr(t, 0.05 + i * 0.05, 0.35));
    const s0 = 0.7 + i * 0.25, p = eio(pr(t, s0, 0.2));
    if (p >= 1) { done++; lastDone = Math.max(lastDone, s0 + 0.2); }
    ctx.globalAlpha = a;
    txt(pad(i + 1), 100, y + (1 - a) * 30 - 4, { mono: 1, s: 18, c: INK2 });
    txt(it, 160, y + (1 - a) * 30, { w: 600, s: 48, c: p > 0 ? `rgba(11,11,11,${1 - 0.62 * p})` : INK });
    if (p > 0) { ctx.fillStyle = RED; ctx.fillRect(150, y - 22, (tw(it, 600, 48) + 20) * p, 9); }
    ctx.globalAlpha = 1;
  });
  // ce qui reste
  const ky = 300 + 7 * 76 + 14, ka = eo(pr(t, 0.4, 0.35)), kp = eio(pr(t, 2.55, 0.35));
  ctx.globalAlpha = ka;
  const kw = tw('Votre métier', 800, 58);
  ctx.fillStyle = RED; ctx.fillRect(146, ky - 56, (kw + 30) * kp, 74);
  txt('Votre métier', 160, ky, { w: 800, s: 58, c: kp > 0.55 ? WHITE : INK });
  ctx.globalAlpha = 1;
  // compteur
  const n = 7 - done, pop = 1 + 0.1 * (1 - eo((t - lastDone) / 0.3));
  txt('EN TÊTE', 1310, 300, { mono: 1, s: 22, c: INK2, ls: 3, a: eo(pr(t, 0.1, 0.3)) });
  ctx.save(); ctx.translate(1300, 690); ctx.scale(pop, pop);
  txt(pad(n), 0, 0, { w: 800, s: 400, c: n === 0 ? RED : INK, a: eo(pr(t, 0.1, 0.4)) });
  ctx.restore();
  txt('Il ne vous reste', 1310, 790, { w: 600, s: 40, c: INK, a: eo(pr(t, 2.75, 0.3)) });
  txt('que votre métier.', 1310, 840, { w: 600, s: 40, c: INK, a: eo(pr(t, 2.85, 0.3)) });
  panelFromBottom(pr(t, 3.15, 0.45), INK);
}

/* ============ 2. Pensez à autre chose ============ */
function sTitre(t) {
  bg(INK); grid(true); chrome(true, 'NOBRAYN', 'FIG. 2', eo(pr(t, 0.1, 0.3)));
  const L = ['Pensez', 'à autre', 'chose'], base = [360, 590, 820];
  L.forEach((s, i) => reveal(s, 150, base[i], eo(pr(t, 0.05 + i * 0.12, 0.55)), { w: 800, s: 230, c: PAPER }));
  const dw = tw('chose', 800, 230), dp = eb(pr(t, 0.6, 0.35));
  if (dp > 0) { ctx.save(); ctx.translate(150 + dw + 40, 800); ctx.scale(dp, dp); ctx.fillStyle = RED2; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill(); ctx.restore(); }
  txt('LE CATALOGUE', 1300, 720, { mono: 1, s: 22, c: RED2, ls: 3, a: eo(pr(t, 0.9, 0.3)) });
  reveal("Tout ce qu'on raye", 1300, 790, eo(pr(t, 0.95, 0.4)), { w: 700, s: 52, c: PAPER });
  reveal('pour vous.', 1300, 852, eo(pr(t, 1.05, 0.4)), { w: 700, s: 52, c: PAPER });
  panelFromLeft(pr(t, 2.0, 0.4), RED);
}

/* ============ 3. Les pôles ============ */
function poleFrame(t, P, endColor) {
  bg(PAPER); grid(false); chrome(false, 'NOBRAYN — LE CATALOGUE', `PÔLE ${P.n} / 04`);
  // progression des pôles
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i < +P.n ? RED : 'rgba(11,11,11,0.12)'; ctx.fillRect(160 + i * 92, 975, 80, 6); }
  ctx.fillStyle = RED; ctx.fillRect(160 + (+P.n - 1) * 92, 975, 80 * eo(pr(t, 0.3, 2.4)) * 0 + 80, 6);
  reveal(P.n, 150, 340, eo(pr(t, 0.2, 0.45)), { w: 800, s: 210, c: RED });
  P.title.forEach((l, i) => reveal(l, 156, 470 + i * 96, eo(pr(t, 0.3 + i * 0.08, 0.45)), { w: 800, s: 92, c: INK }));
  const py = 470 + P.title.length * 96 - 10;
  P.pitch.forEach((l, i) => txt(l, 160, py + i * 42, { w: 500, s: 32, c: INK2, a: eo(pr(t, 0.6 + i * 0.06, 0.35)) }));
  let x = 160; const cy = py + P.pitch.length * 42 + 30;
  P.chips.forEach((c, i) => { const w = pill(c, x, cy, pr(t, 0.85 + i * 0.1, 0.4), i === P.chips.length - 1 && P.lastFilled); x += (w || tw(c, 600, 26) + 44) + 14; });
  P.demo(t);
  panelToRight(pr(t, 0, 0.35), RED);
  panelFromLeft(pr(t, 2.85, 0.35), endColor || RED);
}

// --- Pôle 01 : Site, SEO, GEO
function demoSite(t) {
  // navigateur
  if (card(900, 200, 470, 680, pr(t, 0.3, 0.4))) {
    ctx.fillStyle = 'rgba(11,11,11,0.06)'; ctx.fillRect(902, 202, 466, 46);
    ['#e30613', '#c9c8c2', '#c9c8c2'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(926 + i * 20, 225, 6, 0, 7); ctx.fill(); });
    rr(1000, 212, 300, 26, 13, WHITE, 'rgba(11,11,11,0.15)', 1);
    txt('votre-entreprise.fr', 1150, 231, { mono: 1, s: 15, c: INK2, align: 'center' });
    const b = (i) => eo(pr(t, 0.5 + i * 0.08, 0.3));
    ctx.globalAlpha = b(0); ctx.fillStyle = INK; ctx.fillRect(926, 272, 80, 12); ctx.fillStyle = 'rgba(11,11,11,0.2)'; [1150, 1210, 1270].forEach((x) => ctx.fillRect(x, 274, 44, 8));
    ctx.globalAlpha = b(1); rr(926, 304, 418, 230, 10, INK);
    txt('Votre entreprise', 950, 380, { w: 800, s: 38, c: PAPER });
    txt('Plomberie · Lyon et alentours', 950, 418, { w: 500, s: 20, c: 'rgba(243,242,238,0.7)' });
    rr(950, 450, 190, 50, 25, RED); txt('Devis en 2 min', 1045, 482, { w: 700, s: 20, c: WHITE, align: 'center' });
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = b(2 + i); rr(926 + i * 144, 556, 130, 150, 8, 'rgba(11,11,11,0.06)'); ctx.fillStyle = RED; ctx.fillRect(926 + i * 144, 556, 40, 5); ctx.fillStyle = 'rgba(11,11,11,0.25)'; ctx.fillRect(940 + i * 144, 650, 90, 8); ctx.fillRect(940 + i * 144, 670, 60, 8); }
    ctx.globalAlpha = b(5); ctx.fillStyle = 'rgba(11,11,11,0.15)'; [728, 748, 768].forEach((y, i) => ctx.fillRect(926, y, 418 - i * 90, 9));
    ctx.globalAlpha = b(6); rr(926, 800, 418, 56, 10, null, 'rgba(11,11,11,0.25)', 2); txt('★★★★★  Avis clients', 950, 836, { w: 600, s: 20, c: INK });
    ctx.globalAlpha = 1; endCard();
  }
  // Google
  if (card(1400, 200, 360, 340, pr(t, 1.0, 0.35))) {
    txt('GOOGLE · SEO', 1424, 236, { mono: 1, s: 15, c: RED, ls: 2 });
    rr(1424, 252, 312, 44, 22, null, 'rgba(11,11,11,0.3)', 2);
    const q = 'plombier lyon', n = Math.floor(q.length * pr(t, 1.1, 0.35));
    txt(q.slice(0, n) + (t < 1.5 && Math.floor(t * 6) % 2 ? '|' : ''), 1446, 281, { w: 500, s: 19, c: INK });
    const m = eio(pr(t, 1.6, 0.45)); // remontée de 4e à 1re place
    const rows = [0, 1, 2], ys = (k) => 316 + k * 52;
    rows.forEach((k) => { const yy = ys(k) + 52 * m; ctx.fillStyle = 'rgba(11,11,11,0.12)'; ctx.fillRect(1424, yy + 10, 220 - k * 30, 10); ctx.fillStyle = 'rgba(11,11,11,0.07)'; ctx.fillRect(1424, yy + 28, 280, 8); });
    const yy = ys(3) - 156 * m;
    rr(1418, yy, 324, 48, 8, m > 0.5 ? 'rgba(227,6,19,0.08)' : null); ctx.fillStyle = RED; ctx.fillRect(1418, yy, 5, 48);
    txt('Votre entreprise', 1434, yy + 22, { w: 700, s: 19, c: INK }); txt('★★★★★ · Ouvert', 1434, yy + 41, { w: 500, s: 14, c: INK2 });
    const bp = eb(pr(t, 2.0, 0.35)); if (bp > 0) { ctx.save(); ctx.translate(1712, yy + 24); ctx.scale(bp, bp); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill(); txt('#1', 0, 6, { w: 800, s: 16, c: WHITE, align: 'center' }); ctx.restore(); }
    endCard();
  }
  // IA
  if (card(1400, 570, 360, 310, pr(t, 1.7, 0.35))) {
    txt('IA · GEO', 1424, 606, { mono: 1, s: 15, c: RED, ls: 2 });
    const q = eb(pr(t, 1.85, 0.3));
    if (q > 0) { rr(1500, 624, 236, 62, 14, 'rgba(11,11,11,0.07)'); txt('Un bon plombier', 1516, 650, { w: 600, s: 18, c: INK }); txt('près de chez moi ?', 1516, 674, { w: 600, s: 18, c: INK }); }
    if (t > 2.05 && t < 2.3) for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(11,11,11,${0.25 + 0.5 * (Math.floor(t * 10) % 3 === i)})`; ctx.beginPath(); ctx.arc(1444 + i * 16, 722, 5, 0, 7); ctx.fill(); }
    const a = eb(pr(t, 2.3, 0.3));
    if (a > 0) { ctx.save(); ctx.globalAlpha = cl(a); rr(1424, 704, 290, 124, 14, INK); txt('Je vous conseille', 1442, 740, { w: 600, s: 19, c: PAPER }); txt('Votre entreprise :', 1442, 768, { w: 800, s: 22, c: RED2 }); txt('4,9 ★ · répond en 1 h.', 1442, 800, { w: 500, s: 18, c: 'rgba(243,242,238,0.75)' }); ctx.restore(); }
    endCard();
  }
}

// --- Pôle 02 : SEM
function demoSem(t) {
  if (card(900, 200, 860, 350, pr(t, 0.3, 0.35))) {
    txt('VOS DEMANDES, SEMAINE APRÈS SEMAINE', 930, 244, { mono: 1, s: 16, c: INK2, ls: 2 });
    ctx.fillStyle = 'rgba(11,11,11,0.07)'; for (let i = 0; i < 4; i++) ctx.fillRect(930, 290 + i * 62, 800, 1);
    const pts = [0.08, 0.12, 0.1, 0.18, 0.24, 0.22, 0.34, 0.42, 0.5, 0.58, 0.7, 0.86];
    const X = (i) => 940 + i * 70, Y = (v) => 510 - v * 220, p = eio(pr(t, 0.5, 1.3)), xm = X(0) + (X(11) - X(0)) * p;
    ctx.save(); ctx.beginPath(); ctx.rect(900, 200, xm - 900 + 2, 350); ctx.clip();
    ctx.beginPath(); pts.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.lineTo(X(11), 512); ctx.lineTo(X(0), 512); ctx.closePath(); ctx.fillStyle = 'rgba(227,6,19,0.1)'; ctx.fill();
    ctx.beginPath(); pts.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
    const fi = Math.min(11, Math.floor(p * 11 + 0.0001)), fr = p * 11 - fi, yv = fi < 11 ? pts[fi] + (pts[fi + 1] - pts[fi]) * fr : pts[11];
    if (p > 0) { const pu = 1 + 0.5 * (0.5 + 0.5 * Math.sin(t * 9)); ctx.fillStyle = 'rgba(227,6,19,0.2)'; ctx.beginPath(); ctx.arc(xm, Y(yv), 14 * pu, 0, 7); ctx.fill(); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(xm, Y(yv), 9, 0, 7); ctx.fill(); }
    endCard();
  }
  const tiles = [
    ['SEA · GOOGLE ADS', (x, y, k) => { txt('Annonce', x, y, { w: 700, s: 15, c: INK2 }); txt('Plombier Lyon', x, y + 34, { w: 800, s: 26, c: INK }); txt('Intervention 7 j/7', x, y + 64, { w: 500, s: 18, c: INK2 }); rr(x, y + 94, 150, 46, 23, RED); txt('Appeler', x + 75, y + 124, { w: 700, s: 18, c: WHITE, align: 'center' }); const r = eo(pr(k, 1.9, 0.6)); if (r > 0 && r < 1) rr(x - 10 * r, y + 84 - 10 * r, 170 + 20 * r, 66 + 20 * r, 33 + 10 * r, null, `rgba(227,6,19,${1 - r})`, 3); }],
    ['SMA · RÉSEAUX SOCIAUX', (x, y, k) => { const g = ctx.createLinearGradient(x, y - 20, x + 222, y + 100); g.addColorStop(0, '#2a2a2e'); g.addColorStop(1, '#0b0b0b'); rr(x, y - 22, 222, 120, 10, g); txt('AVANT / APRÈS', x + 111, y + 46, { mono: 1, s: 16, c: PAPER, align: 'center', ls: 2 }); const h = eb(pr(k, 1.9, 0.35)); ctx.save(); ctx.translate(x + 14, y + 128); ctx.scale(Math.max(0.001, h), Math.max(0.001, h)); txt('♥', 0, 8, { w: 800, s: 30, c: RED, align: 'center' }); ctx.restore(); ctx.fillStyle = 'rgba(11,11,11,0.2)'; ctx.fillRect(x + 40, y + 122, 120, 9); ctx.fillRect(x + 40, y + 140, 80, 9); }],
    ['LSA · ANNONCES LOCALES', (x, y, k) => { rr(x, y - 22, 222, 120, 10, 'rgba(11,11,11,0.05)'); ctx.strokeStyle = 'rgba(11,11,11,0.12)'; ctx.lineWidth = 2; [[0, 30, 222, 60], [60, -22, 90, 98], [0, 70, 222, 40], [150, -22, 120, 98]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(x + a, y + b); ctx.lineTo(x + c, y + d); ctx.stroke(); }); const dp = eb(pr(k, 1.9, 0.45)); const py = y + 40 - (1 - cl(dp)) * 70; ctx.globalAlpha = cl(dp * 2); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x + 111, py - 18, 16, Math.PI, 0); ctx.lineTo(x + 111, py + 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(x + 111, py - 18, 6, 0, 7); ctx.fill(); ctx.globalAlpha = 1; txt('Votre entreprise · 2 km', x, y + 128, { w: 700, s: 18, c: INK }); rr(x, y + 140, 120, 34, 17, null, INK, 2); txt('Appeler', x + 60, y + 163, { w: 700, s: 15, c: INK, align: 'center' }); }]
  ];
  tiles.forEach(([lab, draw], i) => {
    const x = 900 + i * 295;
    if (card(x, 580, 270, 300, pr(t, 1.0 + i * 0.15, 0.35))) { txt(lab, x + 24, 616, { mono: 1, s: 14, c: RED, ls: 1.5 }); draw(x + 24, 670, t); endCard(); }
  });
}

// --- Pôle 03 : Automatisations
const FLOWS = [
  [['Chantier', 'terminé'], ["Demande d'avis", 'envoyée'], ['★★★★★', 'Nouvel avis']],
  [['Devis', 'envoyé'], ['Relance', 'à J+3'], ['Devis', 'signé ✓']],
  [['Demande', 'sur le site'], ['Ajoutée', "à l'agenda"], ['Récap', 'du lundi']]
];
function demoAuto(t) {
  if (!card(900, 200, 860, 680, pr(t, 0.25, 0.35))) return;
  txt('SCÉNARIOS AUTOMATIQUES', 930, 246, { mono: 1, s: 16, c: INK2, ls: 2 });
  const live = 0.5 + 0.5 * Math.sin(t * 8); ctx.fillStyle = `rgba(227,6,19,${0.5 + 0.5 * live})`; ctx.beginPath(); ctx.arc(1590, 240, 7, 0, 7); ctx.fill();
  txt('24 H/24', 1730, 246, { mono: 1, s: 16, c: RED, ls: 2, align: 'right' });
  const NX = [930, 1210, 1490], NW = 240, NH = 104;
  FLOWS.forEach((row, r) => {
    const y = 290 + r * 190, t0 = 0.4 + r * 0.32;
    // liaisons
    for (let k = 0; k < 2; k++) {
      const x1 = NX[k] + NW, x2 = NX[k + 1], ly = y + NH / 2, lp = eio(pr(t, t0 + 0.25 + k * 0.35, 0.3));
      ctx.strokeStyle = 'rgba(11,11,11,0.3)'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -t * 40; ctx.beginPath(); ctx.moveTo(x1, ly); ctx.lineTo(x1 + (x2 - x1) * lp, ly); ctx.stroke(); ctx.setLineDash([]);
      const dp = pr(t, t0 + 0.45 + k * 0.35, 0.35);
      if (dp > 0 && dp < 1) { const px = x1 + (x2 - x1) * eio(dp); ctx.fillStyle = 'rgba(227,6,19,0.25)'; ctx.beginPath(); ctx.arc(px, ly, 14, 0, 7); ctx.fill(); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(px, ly, 8, 0, 7); ctx.fill(); }
    }
    row.forEach((lines, k) => {
      const p = eb(pr(t, t0 + k * 0.12, 0.35)); if (p <= 0) return;
      const doneP = k === 2 ? eo(pr(t, t0 + 1.15, 0.25)) : 0, active = k === 1 && t > t0 + 0.8;
      ctx.save(); ctx.translate(NX[k] + NW / 2, y + NH / 2); ctx.scale(p, p);
      rr(-NW / 2, -NH / 2, NW, NH, 14, doneP > 0.5 ? RED : k === 0 ? WHITE : 'rgba(11,11,11,0.05)', doneP > 0.5 ? RED : active ? RED : INK, 2.5);
      txt(lines[0], -NW / 2 + 22, -6, { w: 700, s: 22, c: doneP > 0.5 ? WHITE : INK });
      txt(lines[1], -NW / 2 + 22, 24, { w: 500, s: 20, c: doneP > 0.5 ? 'rgba(255,255,255,0.85)' : INK2 });
      if (doneP > 0) { const s = eb(doneP); ctx.globalAlpha = 1 - cl((doneP - 0.4) * 2); rr(-NW / 2 - 8 * s, -NH / 2 - 8 * s, NW + 16 * s, NH + 16 * s, 18, null, RED, 3); ctx.globalAlpha = 1; }
      ctx.restore();
    });
  });
  endCard();
}

// --- Pôle 04 : Agentique
function bubble(lines, x, y, side, p, dark, redFill) {
  const k = eb(p); if (p <= 0) return 0;
  const w = Math.max(...lines.map((l) => tw(l, 600, 19))) + 36, h = lines.length * 26 + 22, bx = side === 'r' ? x - w : x;
  ctx.save(); ctx.translate(side === 'r' ? x : x, y + h); ctx.scale(k, k); ctx.translate(-(side === 'r' ? x : x), -(y + h));
  rr(bx, y, w, h, 18, redFill ? RED : dark ? INK : 'rgba(11,11,11,0.07)');
  lines.forEach((l, i) => txt(l, bx + 18, y + 34 + i * 26, { w: 600, s: 19, c: redFill || dark ? WHITE : INK }));
  ctx.restore(); return h;
}
function demoAgent(t) {
  // téléphone
  if (card(960, 170, 400, 740, pr(t, 0.2, 0.35), { r: 54, fill: INK, stroke: INK })) {
    rr(976, 186, 368, 708, 42, '#fafaf7');
    rr(1110, 198, 100, 26, 13, INK);
    txt('22:14', 1010, 218, { mono: 1, s: 15, c: INK });
    ctx.fillStyle = 'rgba(11,11,11,0.08)'; ctx.fillRect(976, 252, 368, 1);
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(1010, 286, 16, 0, 7); ctx.fill(); txt('N', 1010, 292, { w: 800, s: 16, c: WHITE, align: 'center' });
    txt('Votre entreprise', 1036, 282, { w: 700, s: 18, c: INK }); txt('● Assistant · en ligne', 1036, 302, { w: 500, s: 13, c: '#1a9b4b' });
    let y = 340;
    y += bubble(['Bonsoir, une fuite sous', "l'évier. Vous passez ?"], 996, y, 'l', pr(t, 0.45, 0.3)) + 14;
    if (t > 0.85 && t < 1.2) for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(11,11,11,${0.25 + 0.5 * (Math.floor(t * 10) % 3 === i)})`; ctx.beginPath(); ctx.arc(1290 + i * 16 - 32, y + 18, 5, 0, 7); ctx.fill(); }
    if (t >= 1.2) y += bubble(['Bonsoir ! Jeudi 9 h', 'ou vendredi 14 h ?'], 1324, y, 'r', pr(t, 1.2, 0.3), true) + 14;
    if (t >= 1.65) y += bubble(['Jeudi 9 h, parfait.'], 996, y, 'l', pr(t, 1.65, 0.3)) + 14;
    if (t >= 2.05) y += bubble(["C'est noté ✓", 'Confirmation envoyée.'], 1324, y, 'r', pr(t, 2.05, 0.3), false, true) + 14;
    endCard();
  }
  // agenda
  if (card(1400, 250, 360, 470, pr(t, 0.6, 0.35))) {
    txt('AGENDA · SEMAINE', 1424, 290, { mono: 1, s: 15, c: INK2, ls: 2 });
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], cx = (d) => 1424 + d * 64;
    days.forEach((d, i) => { txt(d, cx(i) + 26, 330, { w: 600, s: 16, c: i === 3 ? RED : INK2, align: 'center' }); ctx.fillStyle = 'rgba(11,11,11,0.06)'; ctx.fillRect(cx(i), 345, 54, 350); });
    [[0, 380, 70], [1, 520, 90], [2, 430, 60], [4, 600, 80], [1, 380, 50]].forEach(([d, y, h]) => rr(cx(d) + 3, y, 48, h, 6, 'rgba(11,11,11,0.16)'));
    const sp = eb(pr(t, 2.25, 0.35));
    if (sp > 0) { ctx.save(); ctx.translate(cx(3) + 27, 400); ctx.scale(sp, sp); rr(-30, -40, 60, 80, 8, RED); ctx.restore(); }
    if (t > 2.4) { const a = eo(pr(t, 2.4, 0.3)); ctx.globalAlpha = a; rr(1424, 640 + (1 - a) * 10, 310, 50, 10, INK); txt('Jeu 9 h · Fuite évier ✓', 1440, 672 + (1 - a) * 10, { w: 700, s: 18, c: WHITE }); ctx.globalAlpha = 1; }
    endCard();
  }
  txt('Répond 24 h/24 · 7 j/7', 1400, 770, { mono: 1, s: 20, c: RED, ls: 1, a: eo(pr(t, 1.0, 0.4)) });
  txt('Vous gardez la main', 1400, 806, { w: 600, s: 26, c: INK, a: eo(pr(t, 1.1, 0.4)) });
  txt('sur chaque réponse.', 1400, 840, { w: 600, s: 26, c: INK, a: eo(pr(t, 1.2, 0.4)) });
}

const POLES = [
  { n: '01', title: ['Site,', 'SEO & GEO'], pitch: ['On vous trouve sur Google', 'et dans les réponses des IA.'], chips: ['Site', 'Site + GEO', 'Site + GEO + SEO'], lastFilled: true, demo: demoSite },
  { n: '02', title: ['Publicité', 'en ligne'], pitch: ['Des annonces qui font sonner', 'le téléphone, budget suivi.'], chips: ['SEA', 'SMA', 'LSA'], demo: demoSem },
  { n: '03', title: ['Automati-', 'sations'], pitch: ['Avis, relances, agenda :', 'ça tourne tout seul.'], chips: ['V1', 'V2', 'Sur mesure'], lastFilled: true, demo: demoAuto },
  { n: '04', title: ['Agents IA', ''], pitch: ['Un assistant qui répond,', 'qualifie et prend les RDV.'], chips: ['V1', 'V2', 'Sur mesure'], lastFilled: true, demo: demoAgent }
];
POLES[3].title = ['Agents IA'];

/* ============ 4. La machine ============ */
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
function sMachine(t) {
  bg(INK);
  // sol en perspective
  const hz = 600, vx = W / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(0, hz, W, H - hz); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1.2;
  for (let i = -26; i <= 26; i++) { ctx.beginPath(); ctx.moveTo(vx + i * 14, hz); ctx.lineTo(vx + i * 240, H); ctx.stroke(); }
  for (let j = 0; j < 16; j++) { const z = j + 1 - (t * 0.8) % 1, y = hz + (H - hz) * (1 / (z * 0.55 + 0.45)) * 0.9; if (y > H || y < hz) continue; ctx.globalAlpha = cl((y - hz) / (H - hz) * 1.6); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore(); ctx.globalAlpha = 1;
  const g = ctx.createRadialGradient(960, 700, 0, 960, 700, 700); g.addColorStop(0, 'rgba(255,51,38,0.2)'); g.addColorStop(1, 'rgba(255,51,38,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  grid(true); chrome(true, 'NOBRAYN — LA MACHINE', 'FIG. 3');
  reveal('Ça rentre.', 156, 230, eo(pr(t, 0.05, 0.45)), { w: 800, s: 88, c: PAPER });
  reveal('Ça ressort fait.', 156, 324, eo(pr(t, 0.15, 0.45)), { w: 800, s: 88, c: RED2 });
  // horloge jour et nuit
  const mins = 8 * 60 + Math.floor(t * 230); const hh = Math.floor(mins / 60) % 24, mm = mins % 60;
  txt('JOUR ET NUIT', 1840, 170, { mono: 1, s: 18, c: 'rgba(243,242,238,0.6)', ls: 3, align: 'right' });
  txt(pad(hh) + ':' + pad(mm), 1840, 250, { mono: 1, s: 64, c: PAPER, align: 'right' });
  // tapis
  const BY = 780; ctx.fillStyle = '#18181d'; ctx.fillRect(0, BY, W, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = -60 + (t * 600) % 60; x < W; x += 60) ctx.fillRect(x, BY + 4, 26, 18);
  // cartes
  const BX0 = 800, BX1 = 1120, CW = 300, CH = 112, SP = 900, GAP = 0.36;
  let done = 0;
  JOBS.forEach((j, k) => {
    const ts = 0.25 + k * GAP, x = -CW - 40 + (t - ts) * SP;
    if (t >= ts && x < BX0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, BX0, H); ctx.clip(); rr(x, BY - CH - 6, CW, CH, 12, PAPER); txt(j[0], x + 20, BY - CH + 34, { w: 700, s: 25, c: INK }); txt(j[1], x + 20, BY - CH + 68, { mono: 1, s: 16, c: INK2 }); ctx.restore(); }
    const tin = ts + (BX0 + CW + 40) / SP, xo = BX0 - CW + (t - tin - 0.22) * SP + CW;
    const ox = BX1 - CW + (t - tin - 0.22) * SP;
    if (t > tin + 0.22 && ox < W) { ctx.save(); ctx.beginPath(); ctx.rect(BX1, 0, W - BX1, H); ctx.clip(); rr(ox, BY - CH - 6, CW, CH, 12, RED); txt('✓ ' + j[2], ox + 20, BY - CH + 34, { w: 800, s: 25, c: WHITE }); txt(j[3], ox + 20, BY - CH + 68, { mono: 1, s: 16, c: 'rgba(255,255,255,0.85)' }); ctx.restore(); }
    if (ox > BX1) done++;
  });
  // la machine
  ctx.save(); ctx.shadowColor = RED2; ctx.shadowBlur = 40 + 15 * Math.sin(t * 6);
  rr(BX0, 520, BX1 - BX0, 300, 22, '#121217', RED2, 4); ctx.restore();
  rr(BX0, 520, BX1 - BX0, 300, 22, null, RED2, 4);
  const cx = (BX0 + BX1) / 2, cy = 640;
  const cg = ctx.createRadialGradient(cx - 14, cy - 14, 4, cx, cy, 52); cg.addColorStop(0, '#ff8f84'); cg.addColorStop(0.6, RED2); cg.addColorStop(1, '#8e0f08');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, 46 * (1 + 0.04 * Math.sin(t * 8)), 0, 7); ctx.fill();
  ctx.strokeStyle = '#e8e6e0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, 82, 22, t * 2.2, 0, 7); ctx.stroke();
  ctx.strokeStyle = RED2; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy, 70, 30, -t * 1.6 + 1, 0, 7); ctx.stroke();
  txt('NOBRAYN', cx, 760, { mono: 1, s: 20, c: PAPER, align: 'center', ls: 4 });
  for (let i = 0; i < 6; i++) { ctx.fillStyle = (Math.floor(t * 8) + i) % 3 === 0 ? RED2 : 'rgba(255,255,255,0.15)'; ctx.fillRect(cx - 75 + i * 26, 784, 18, 6); }
  // compteur
  txt('FAIT', 1840, 400, { mono: 1, s: 18, c: 'rgba(243,242,238,0.6)', ls: 3, align: 'right' });
  txt(pad(done), 1840, 500, { w: 800, s: 110, c: RED2, align: 'right' });
  panelFromBottom(pr(t, 4.6, 0.45), PAPER);
}

/* ============ 5. Fin ============ */
const BAND = 'SITE   /   SEO   /   GEO   /   SEA   /   SMA   /   LSA   /   AUTOMATISATIONS   /   AGENTS IA   /   SUR MESURE   /   ';
function sFin(t) {
  bg(PAPER); grid(false); chrome(false, 'NOBRAYN', 'FIG. 4', eo(pr(t, 0, 0.3)));
  const S = 270, wNo = tw('no', 800, S), wBr = tw('brayn', 800, S), wDot = tw('.', 800, S), x0 = (W - (wNo + wBr + wDot)) / 2, by = 470;
  const lp = eo(pr(t, 0.0, 0.5));
  ctx.save(); ctx.beginPath(); ctx.rect(0, by - S, W, S * 1.25); ctx.clip();
  const oy = (1 - lp) * S;
  txt('no', x0, by + oy, { w: 800, s: S, c: INK }); txt('brayn', x0 + wNo, by + oy, { w: 800, s: S, c: INK }); txt('.', x0 + wNo + wBr, by + oy, { w: 800, s: S, c: RED });
  ctx.restore();
  const sp = eio(pr(t, 0.45, 0.4)); ctx.fillStyle = RED; ctx.fillRect(x0 + wNo - 10, by - 92, (wBr + 20) * sp, 28);
  reveal('Pensez à autre chose.', W / 2 - tw('Pensez à autre chose.', 600, 60) / 2, 580, eo(pr(t, 0.75, 0.45)), { w: 600, s: 60, c: INK });
  // bandeau du catalogue
  const bw = eio(pr(t, 1.0, 0.5)) * W;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 650, bw, 96); ctx.clip();
  ctx.fillStyle = INK; ctx.fillRect(0, 650, W, 96);
  font(500, 30, 1); ctx.letterSpacing = '3px'; const bwid = ctx.measureText(BAND).width; ctx.letterSpacing = '0px';
  for (let x = -((t * 160) % bwid); x < W; x += bwid) txt(BAND, x, 710, { mono: 1, s: 30, c: PAPER, ls: 3 });
  ctx.restore();
  reveal('nobrayn.fr', W / 2 - tw('nobrayn.fr', 800, 76) / 2, 880, eo(pr(t, 1.4, 0.45)), { w: 800, s: 76, c: RED });
  txt('contact@nobrayn.fr', W / 2, 940, { mono: 1, s: 24, c: INK2, align: 'center', ls: 2, a: eo(pr(t, 1.6, 0.4)) });
}

const SCENES = [
  ['liste', 3.6, sListe],
  ['titre', 2.4, sTitre],
  ['pole1', 3.2, (t) => poleFrame(t, POLES[0])],
  ['pole2', 3.2, (t) => poleFrame(t, POLES[1])],
  ['pole3', 3.2, (t) => poleFrame(t, POLES[2])],
  ['pole4', 3.2, (t) => poleFrame(t, POLES[3], INK)],
  ['machine', 5.0, sMachine],
  ['fin', 3.8, sFin]
];
// Durées allongées (lecture) et calées sur la musique à 120 BPM : chaque passage tombe sur un temps
const DUR = [4.0, 2.5, 4.0, 4.0, 4.0, 4.0, 5.5, 4.5], XF = 0.8;
const START = DUR.reduce((a, d, i) => (a.push(i ? a[i - 1] + DUR[i - 1] : 0), a), []);
const TOTAL = START[7] + DUR[7];
/* ================= Musique : électro douce à 120 BPM, jouée en direct (Web Audio) ================= */
const Music = (() => {
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function build(ac, t0, out) {
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const at = (t) => t0 + t;
    const noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    // bus
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.2;
    const master = ac.createGain(); comp.connect(master); master.connect(out);
    master.gain.setValueAtTime(0, at(0)); master.gain.linearRampToValueAtTime(0.8, at(0.4));
    master.gain.setValueAtTime(0.8, at(TOTAL - 1.6)); master.gain.linearRampToValueAtTime(0, at(TOTAL));
    const musical = ac.createGain(); musical.connect(comp); // respire sur la grosse caisse
    const dry = ac.createGain(); dry.connect(comp);
    const rev = ac.createConvolver(), irLen = Math.floor(ac.sampleRate * 2.4), ir = ac.createBuffer(2, irLen, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < irLen; i++) d[i] = (rnd() * 2 - 1) * Math.exp(-i / ac.sampleRate / 0.55); }
    rev.buffer = ir; const wet = ac.createGain(); wet.gain.value = 0.3; rev.connect(wet); wet.connect(comp);
    const send = ac.createGain(); send.connect(rev);
    const filt = (type, f, q) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; };
    const panner = (p) => { const s = ac.createStereoPanner(); s.pan.value = p; return s; };
    const gainNode = (v) => { const g = ac.createGain(); g.gain.value = v; return g; };
    const noiseSrc = (st, en, loop) => { const s = ac.createBufferSource(); s.buffer = noise; s.loop = !!loop; s.start(st, loop ? 0 : rnd() * 1.6); s.stop(en); return s; };
    const osc = (type, f, st, en) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.start(st); o.stop(en); return o; };

    function pad(chord, a, z, g = 0.09, cutoff = 1400, att = 0.5) {
      const st = at(a), en = at(z), vg = ac.createGain();
      vg.gain.setValueAtTime(0, st); vg.gain.linearRampToValueAtTime(g, st + att); vg.gain.setValueAtTime(g, en); vg.gain.linearRampToValueAtTime(0, en + 0.8);
      const f1 = filt('lowpass', cutoff, 0.5), f2 = filt('lowpass', cutoff, 0.5); f1.connect(f2); f2.connect(vg);
      const n = chord.length * 3;
      chord.forEach((m, k) => [-7, 0, 7].forEach((d) => {
        const o = osc('sawtooth', hz(m), st, en + 0.9); o.detune.value = d;
        const og = gainNode(1 / n), p = panner((k % 2 ? 0.5 : -0.5) * (d ? 1 : 0.4)); o.connect(og); og.connect(p); p.connect(f1);
      }));
      vg.connect(musical); const sg = gainNode(0.5); vg.connect(sg); sg.connect(send);
    }
    function bass(m, a, dur, g = 0.32) {
      const st = at(a), en = st + dur * 1.3, e = ac.createGain();
      e.gain.setValueAtTime(0, st); e.gain.linearRampToValueAtTime(g, st + 0.006); e.gain.setTargetAtTime(0, st + 0.006, dur * 0.45);
      const o = osc('sine', hz(m), st, en), s = osc('sawtooth', hz(m), st, en), sf = filt('lowpass', 600), sg = gainNode(0.25);
      o.connect(e); s.connect(sf); sf.connect(sg); sg.connect(e); e.connect(musical);
    }
    function pluck(m, a, g = 0.11, p = 0, dec = 0.28) {
      const st = at(a), en = st + 0.9, e = ac.createGain();
      e.gain.setValueAtTime(0, st); e.gain.linearRampToValueAtTime(g, st + 0.003); e.gain.setTargetAtTime(0, st + 0.003, dec);
      [[1, 1], [2, 0.35], [3, 0.12]].forEach(([r, v]) => { const o = osc('sine', hz(m) * r, st, en), og = gainNode(v); o.connect(og); og.connect(e); });
      const pn = panner(p); e.connect(pn); pn.connect(dry); const sg = gainNode(0.6); pn.connect(sg); sg.connect(send);
    }
    function bell(m, a, g = 0.12) {
      const st = at(a);
      [[1, 1, 1.2], [0.5, 2.76, 0.6], [0.25, 5.4, 0.3]].forEach(([v, r, d]) => {
        const o = osc('sine', hz(m) * r, st, st + 2.5), e = ac.createGain();
        e.gain.setValueAtTime(0, st); e.gain.linearRampToValueAtTime(g * v, st + 0.002); e.gain.setTargetAtTime(0, st + 0.002, d);
        o.connect(e); e.connect(dry); const sg = gainNode(0.9); e.connect(sg); sg.connect(send);
      });
    }
    function kick(a, g = 0.55) {
      const st = at(a), o = osc('sine', 141, st, st + 0.5), e = ac.createGain();
      o.frequency.setValueAtTime(141, st); o.frequency.setTargetAtTime(46, st, 1 / 32);
      e.gain.setValueAtTime(g, st); e.gain.setTargetAtTime(0, st, 1 / 7.5); o.connect(e); e.connect(dry);
      const c = noiseSrc(st, st + 0.03), cf = filt('highpass', 3000), ce = ac.createGain();
      ce.gain.setValueAtTime(g * 0.15, st); ce.gain.setTargetAtTime(0, st, 1 / 300); c.connect(cf); cf.connect(ce); ce.connect(dry);
      musical.gain.setValueAtTime(0.55, st); musical.gain.setTargetAtTime(1, st + 0.001, 0.11);
    }
    function hat(a, g = 0.05, p = 0.25, dec = 60) {
      const st = at(a), s = noiseSrc(st, st + 0.1), f = filt('highpass', 7000), e = ac.createGain(), pn = panner(p);
      e.gain.setValueAtTime(g, st); e.gain.setTargetAtTime(0, st, 1 / dec); s.connect(f); f.connect(e); e.connect(pn); pn.connect(dry);
    }
    function clap(a, g = 0.1) {
      const st = at(a), s = noiseSrc(st, st + 0.35), f = filt('bandpass', 2000, 0.9), e = ac.createGain();
      e.gain.setValueAtTime(g, st); e.gain.setTargetAtTime(0, st, 1 / 18); s.connect(f); f.connect(e); e.connect(dry);
      const sg = gainNode(0.8); e.connect(sg); sg.connect(send);
    }
    function tick(a, g = 0.07, f = 2600) {
      const st = at(a), e = ac.createGain(), pn = panner(rnd() * 0.8 - 0.4);
      e.gain.setValueAtTime(g, st); e.gain.setTargetAtTime(0, st, 1 / 90);
      [[f, 1], [f / 2, 0.5]].forEach(([fr, v]) => { const o = osc('sine', fr, st, st + 0.08), og = gainNode(v); o.connect(og); og.connect(e); });
      e.connect(pn); pn.connect(dry); const sg = gainNode(0.4); pn.connect(sg); sg.connect(send);
    }
    function riser(tEnd, dur, g = 0.07) {
      const st = at(tEnd - dur), en = at(tEnd), s = noiseSrc(st, en + 0.01, true), f = filt('bandpass', 360, 1.2), e = ac.createGain();
      f.frequency.setValueAtTime(360, st); f.frequency.exponentialRampToValueAtTime(5600, en);
      const curve = new Float32Array(64); for (let i = 0; i < 64; i++) curve[i] = g * Math.pow(i / 63, 2.2);
      e.gain.setValueAtTime(0, st); e.gain.setValueCurveAtTime(curve, st, dur * 0.999); e.gain.setValueAtTime(0, en);
      s.connect(f); f.connect(e); e.connect(dry); const sg = gainNode(0.7); e.connect(sg); sg.connect(send);
    }
    function impact(a, g = 0.35) {
      const st = at(a), o = osc('sine', 65, st, st + 1.6), e = ac.createGain();
      o.frequency.setValueAtTime(65, st); o.frequency.setTargetAtTime(40, st, 1 / 8);
      e.gain.setValueAtTime(g, st); e.gain.setTargetAtTime(0, st, 1 / 2.5); o.connect(e); e.connect(dry);
      const s = noiseSrc(st, st + 1.6, true), f = filt('lowpass', 2500), ae = ac.createGain();
      ae.gain.setValueAtTime(g * 0.25, st); ae.gain.setTargetAtTime(0, st, 1 / 3.5); s.connect(f); f.connect(ae); ae.connect(send);
    }

    // ---------- partition (identique à la vidéo) ----------
    const Am = [57, 60, 64, 67, 71], F = [53, 57, 60, 64], C = [48, 55, 60, 64, 67], G = [55, 59, 62, 67], E = [52, 56, 59, 64];
    const ROOT = { Am: 45, F: 41, C: 48, G: 43, E: 40 }, CH = { Am, F, C, G, E };
    const ARP = { Am: [69, 72, 76, 79], F: [65, 69, 72, 76], C: [67, 72, 76, 79], G: [67, 71, 74, 79], E: [68, 71, 76, 80] };
    // 1. la liste
    pad(Am, 0, 4, 0.07, 900, 1.2);
    for (let k = 0; k < 8; k++) pluck(ARP.Am[k % 4], k * 0.5, 0.05, -0.3 + 0.2 * (k % 4));
    for (let i = 0; i < 7; i++) tick((0.7 + i * 0.25) / 0.9);
    bell(81, 2.667, 0.06); impact(2.55 / 0.9, 0.18); riser(4, 1.4, 0.06);
    // 2. le titre
    impact(4, 0.3); pad(F, 4, 6.5, 0.09, 1500); bass(ROOT.F, 4, 2.5, 0.22);
    for (let k = 0; k < 5; k++) pluck(ARP.F[k % 4] + (k === 4 ? 12 : 0), 4 + k * 0.5, 0.06, 0.3 - 0.15 * k);
    riser(6.5, 1.2, 0.07);
    // 3. les pôles
    ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'].forEach((name, b) => {
      const a = 6.5 + b * 2;
      pad(CH[name], a, a + 2, 0.08, 1700);
      for (let q = 0; q < 8; q++) bass(ROOT[name] + (q % 4 === 3 ? 12 : 0), a + q * 0.25, 0.22, 0.26);
      for (let s = 0; s < 16; s++) if (s % 2 === 0 || s === 3 || s === 11) pluck(ARP[name][(Math.floor(s / 2) + b) % 4] + (s % 8 === 6 ? 12 : 0), a + s * 0.125, 0.045, s % 2 ? 0.5 : -0.5, 0.18);
      for (let k = 0; k < 4; k++) { kick(a + k * 0.5); hat(a + k * 0.5 + 0.25, 0.05); hat(a + k * 0.5 + 0.125, 0.018, -0.3); hat(a + k * 0.5 + 0.375, 0.018, -0.3); }
      clap(a + 0.5, 0.07); clap(a + 1.5, 0.07);
    });
    [10.5, 14.5, 18.5].forEach((tb) => { riser(tb, 0.9, 0.05); impact(tb, 0.22); });
    bell(88, 9.0, 0.05);
    // 4. la machine
    riser(22.5, 1, 0.06); impact(22.5, 0.32);
    [['Am', 22.5, 24.5], ['F', 24.5, 26.5], ['E', 26.5, 28]].forEach(([name, a, z]) => {
      pad(CH[name], a, z, 0.07, 1100);
      const n16 = Math.round((z - a) / 0.125);
      for (let s = 0; s < n16; s++) { bass(ROOT[name] + (s % 4 === 2 ? 12 : 0), a + s * 0.125, 0.11, 0.2); hat(a + s * 0.125, s % 2 ? 0.03 : 0.045, 0.3 * (s % 2 ? 1 : -1), 80); }
      for (let k = 0; k < Math.round((z - a) / 0.5); k++) { kick(a + k * 0.5, 0.6); if (k % 2 === 1) clap(a + k * 0.5, 0.08); }
    });
    for (let k = 0; k < 9; k++) tick(22.5 + (0.25 + k * 0.36 + 1.278 + 0.22) / (5 / 5.5), 0.05, 3200);
    riser(28, 1.5, 0.07);
    // 5. la fin
    impact(28, 0.4);
    pad(Am, 28, 30, 0.08, 1300, 0.2); pad(F, 30, 31, 0.07, 1200); pad([57, 60, 64, 71, 76], 31, 32.5, 0.07, 1100, 0.3);
    bass(45, 28, 2, 0.22); bass(41, 30, 1, 0.2); bass(45, 31, 1.5, 0.18);
    [[76, 0], [81, 0.12], [84, 0.24], [88, 0.36]].forEach(([m, dt]) => bell(m, 28.53 + dt, 0.05));
    [69, 72, 76, 79, 81].forEach((m, k) => pluck(m, 29.5 + k * 0.25, 0.04, -0.4 + 0.2 * k));
  }
  return { build };
})();

/* ================= Rendu à n'importe quelle taille ================= */
function makeRenderer(canvas) {
  const main = canvas.getContext('2d');
  const off = [document.createElement('canvas'), document.createElement('canvas')];
  function drawScene(i, tl, target, sc) {
    ctx = target.getContext('2d'); ctx.save(); ctx.setTransform(sc, 0, 0, sc, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
    SCENES[i][2](tl * SCENES[i][1] / DUR[i]);
    ctx.restore(); ctx = null;
  }
  return function renderAt(T) {
    const cw = canvas.width, ch = canvas.height, sc = cw / W;
    off.forEach((c) => { if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; } });
    const act = [];
    for (let i = 0; i < 8; i++) { const a = i ? START[i] - XF / 2 : -1, b = i < 7 ? START[i] + DUR[i] + XF / 2 : TOTAL + 1; if (T >= a && T < b) act.push(i); }
    main.setTransform(1, 0, 0, 1, 0, 0); main.filter = 'none'; main.globalAlpha = 1;
    if (act.length === 1) { drawScene(act[0], T - START[act[0]], off[0], sc); main.drawImage(off[0], 0, 0); return; }
    const [o, n] = act, p = eio((T - (START[n] - XF / 2)) / XF);
    drawScene(o, T - START[o], off[0], sc); drawScene(n, T - START[n], off[1], sc);
    main.filter = `blur(${(p * 10 * sc).toFixed(2)}px)`; main.drawImage(off[0], 0, 0);
    main.filter = `blur(${((1 - p) * 10 * sc).toFixed(2)}px)`; main.globalAlpha = p;
    const s = 1 + 0.025 * (1 - p); main.setTransform(s, 0, 0, s, cw / 2 * (1 - s), ch / 2 * (1 - s)); main.drawImage(off[1], 0, 0);
    main.setTransform(1, 0, 0, 1, 0, 0); main.filter = 'none'; main.globalAlpha = 1;
  };
}
function fit(canvas, max) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.min(max, Math.max(320, Math.round(canvas.clientWidth * dpr)));
  if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round(w * 9 / 16); }
}
const fmt = (s) => Math.floor(s / 60) + ':' + pad(Math.floor(s % 60));

/* ================= Aperçu dans le hero ================= */
const promo = document.getElementById('promo');
if (!promo) return;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pv = document.getElementById('promoPreview'), drawPv = makeRenderer(pv);
let pvRaf = 0, pvVisible = true, pvT0 = 0, lbOpen = false, ready = false;
function pvFrame(now) {
  pvRaf = 0; if (lbOpen || !ready) return;
  fit(pv, 1280);
  const L = 5.4, t = reduce ? 3.75 : ((now - pvT0) / 1000) % L;
  drawPv(Math.min(t, 3.75));
  const fade = cl((t - (L - 0.5)) / 0.5);
  if (fade > 0) { const c = pv.getContext('2d'); c.globalAlpha = fade; c.fillStyle = PAPER; c.fillRect(0, 0, pv.width, pv.height); c.globalAlpha = 1; }
  if (!reduce && pvVisible && !document.hidden) pvRaf = requestAnimationFrame(pvFrame);
}
const pvStart = () => { if (!pvRaf && ready && !lbOpen) pvRaf = requestAnimationFrame(pvFrame); };
if ('IntersectionObserver' in window) new IntersectionObserver((en) => { pvVisible = en.some((e) => e.isIntersecting); pvStart(); }).observe(pv);
document.addEventListener('visibilitychange', pvStart);
window.addEventListener('resize', pvStart);
Promise.all(['500', '600', '700', '800'].map((w) => document.fonts.load(w + ' 40px "Inter Tight"')).concat(document.fonts.load('500 20px "IBM Plex Mono"')))
  .catch(() => {}).then(() => { ready = true; pvT0 = performance.now(); pvStart(); });

/* ================= Lecteur plein écran ================= */
let lb, stage, cv, draw, bar, playBtn, muteBtn, timeEl, progEl, endLink, raf = 0, ac = null, outGain = null, clock = null, playing = false, muted = false, opener = null, pausedAt = 0, perf0 = 0;
function build() {
  if (lb) return;
  lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true;
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Présentation Nobrayn, 32 secondes');
  lb.innerHTML = `<div class="lb-stage"><canvas aria-label="Présentation animée du catalogue Nobrayn"></canvas></div>
    <div class="lb-bar">
      <button type="button" class="lb-play" aria-label="Pause">Pause</button>
      <div class="lb-prog" aria-hidden="true"><i></i></div>
      <span class="lb-time">0:00 / ${fmt(TOTAL)}</span>
      <button type="button" class="lb-mute" aria-pressed="false">Couper le son</button>
      <button type="button" class="lb-full" aria-label="Plein écran">⤢</button>
      <a class="lb-cta" href="#contact" hidden>Nous écrire →</a>
      <button type="button" class="lb-close" aria-label="Fermer">✕</button>
    </div>`;
  document.body.appendChild(lb);
  stage = lb.querySelector('.lb-stage'); cv = stage.querySelector('canvas'); draw = makeRenderer(cv);
  playBtn = lb.querySelector('.lb-play'); muteBtn = lb.querySelector('.lb-mute'); timeEl = lb.querySelector('.lb-time'); progEl = lb.querySelector('.lb-prog i'); endLink = lb.querySelector('.lb-cta');
  playBtn.addEventListener('click', () => (playing ? pause() : clock && clock() >= TOTAL ? start() : resume()));
  muteBtn.addEventListener('click', () => { muted = !muted; muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false'); muteBtn.textContent = muted ? 'Activer le son' : 'Couper le son'; if (outGain) outGain.gain.setValueAtTime(muted ? 0 : 1, ac.currentTime); });
  if (!document.fullscreenEnabled) lb.querySelector('.lb-full').hidden = true;
  lb.querySelector('.lb-full').addEventListener('click', () => {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (stage.requestFullscreen) stage.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {});
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  endLink.addEventListener('click', () => { opener = null; close(); });
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === ' ' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') { e.preventDefault(); playBtn.click(); }
    else if (e.key === 'Tab') { const f = [...lb.querySelectorAll('button:not([hidden]), a:not([hidden])')]; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  });
}
// iPhone : le son Web Audio est coupé par le bouton silencieux tant qu'aucun média n'est en lecture.
// On joue en boucle une piste inaudible pour passer en mode « lecture » (et on le demande à Safari quand il sait faire).
let silent = null;
function silentUrl() {
  const sr = 8000, n = sr / 2, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, i % 2 ? 1 : -1, true);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
function unlockAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  try {
    if (!silent) { silent = document.createElement('audio'); silent.src = silentUrl(); silent.loop = true; silent.preload = 'auto'; silent.setAttribute('playsinline', ''); silent.setAttribute('x-webkit-airplay', 'deny'); }
    const pl = silent.play(); if (pl && pl.catch) pl.catch(() => {});
  } catch (e) {}
}
function stopAudio() { if (silent) silent.pause(); if (ac) { try { ac.close(); } catch (e) {} } ac = null; outGain = null; }
function start() {
  stopAudio(); endLink.hidden = true; unlockAudio();
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ac = new AC(); outGain = ac.createGain(); outGain.gain.value = muted ? 0 : 1; outGain.connect(ac.destination);
    const t0 = ac.currentTime + 0.15; Music.build(ac, t0, outGain); clock = () => ac.currentTime - t0;
    ac.resume();
  } catch (e) { ac = null; perf0 = performance.now() + 150; pausedAt = 0; clock = () => (playing ? (performance.now() - perf0) / 1000 : pausedAt); }
  playing = true; playBtn.textContent = 'Pause'; playBtn.setAttribute('aria-label', 'Pause'); loop();
}
function pause() { if (!playing) return; if (silent) silent.pause(); if (ac) ac.suspend(); else pausedAt = clock(); playing = false; playBtn.textContent = 'Lecture'; playBtn.setAttribute('aria-label', 'Lecture'); }
function resume() { if (playing || !clock) return; if (ac) { unlockAudio(); ac.resume(); } else perf0 = performance.now() - pausedAt * 1000; playing = true; playBtn.textContent = 'Pause'; playBtn.setAttribute('aria-label', 'Pause'); loop(); }
function loop() {
  if (raf) cancelAnimationFrame(raf);
  const step = () => {
    raf = 0; if (!lbOpen) return;
    fit(cv, 1920);
    const T = Math.max(0, clock ? clock() : 0);
    draw(Math.min(T, TOTAL - 0.001));
    progEl.style.width = (cl(T / TOTAL) * 100).toFixed(2) + '%';
    timeEl.textContent = fmt(Math.min(T, TOTAL)) + ' / ' + fmt(TOTAL);
    if (T >= TOTAL) { playing = false; playBtn.textContent = '↺ Revoir'; playBtn.setAttribute('aria-label', 'Revoir'); endLink.hidden = false; return; }
    if (playing) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}
function open(e) {
  if (e) e.preventDefault();
  build(); opener = document.activeElement; lbOpen = true;
  if (pvRaf) { cancelAnimationFrame(pvRaf); pvRaf = 0; }
  lb.hidden = false; document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(() => lb.classList.add('open'));
  start(); lb.querySelector('.lb-close').focus();
}
function close() {
  if (!lbOpen) return;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  lbOpen = false; playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; stopAudio();
  lb.classList.remove('open'); setTimeout(() => { if (!lbOpen) lb.hidden = true; }, 300);
  document.documentElement.style.overflow = '';
  if (opener && opener.focus) opener.focus();
  pvStart();
}
promo.querySelectorAll('[data-promo-open], #promoPlay').forEach((b) => b.addEventListener('click', open));
})();
