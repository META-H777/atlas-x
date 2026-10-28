/* Version hébergée sur nobrayn.fr : base partagée via api.php (injecté par index.php) */
const COCKPIT = __COCKPIT_CONFIG__;
function RemoteDB(cfg) {
  let store = {}, v = -1, ready = false, timer = null, fails = 0;
  const subs = [];
  const clone = (d) => JSON.parse(JSON.stringify(d));
  const notify = () => setTimeout(() => subs.forEach((f) => { try { f(); } catch (e) {} }));
  const hasTasks = () => Object.keys(store).some((k) => k.indexOf('tasks/') === 0);
  function onSync() {
    const b = $('#localBanner'); if (!b) return;
    if (!hasTasks()) {
      b.querySelector('p').innerHTML = '<b>Base vide.</b> <span class="muted">Cliquez sur Importer et choisissez le fichier cockpit-nobrayn-plan-de-lancement.json.</span>';
      const ex = b.querySelector('[data-act="export"]'); if (ex) ex.remove();
      b.hidden = false;
    } else b.hidden = true;
  }
  function apply(res) {
    if (res && res.data && typeof res.v === 'number' && res.v !== v) { store = res.data; v = res.v; ready = true; notify(); onSync(); }
    else if (res && typeof res.v === 'number') ready = true;
  }
  async function call(method, body) {
    const opt = { method, credentials: 'same-origin', cache: 'no-store', headers: { 'X-Cockpit-Token': cfg.csrf } };
    if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    const r = await fetch(cfg.api + (method === 'GET' ? '?v=' + v : ''), opt);
    if (r.status === 401) { location.reload(); throw { code: 'unauthenticated' }; }
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw { code: (j && j.code) || 'unavailable' };
    return j;
  }
  function setOnline(on) { if (S.online !== on) { S.online = on; if (!on) toast('Connexion perdue', 'Je réessaie toutes les quelques secondes.'); scheduleRender(); } }
  async function pull() { try { apply(await call('GET')); fails = 0; setOnline(true); } catch (e) { if (++fails >= 2) setOnline(false); } }
  function loop() { clearTimeout(timer); timer = setTimeout(async () => { await pull(); loop(); }, document.hidden ? 30000 : 4000); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { pull(); loop(); } });
  async function send(op) {
    // Optimiste : on affiche tout de suite, le serveur confirme (ou on recharge sa version)
    const before = store;
    store = Object.assign({}, store);
    if (op.op === 'set') store[op.path] = clone(op.data);
    else if (op.op === 'update') { if (!store[op.path]) { store = before; throw { code: 'not_found' }; } store[op.path] = Object.assign({}, store[op.path], clone(op.data)); }
    else delete store[op.path];
    notify();
    try { apply(await call('POST', { ops: [op] })); }
    catch (e) { store = before; notify(); pull(); throw e; }
  }
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const snapCol = (c) => {
    const docs = Object.keys(store).filter((k) => k.split('/').length === 2 && k.split('/')[0] === c).map((k) => ({ id: k.split('/')[1], exists: true, data: () => store[k], metadata: {} }));
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} };
  };
  const doc = (path) => ({
    id: path.split('/').pop(), path,
    set(d) { return send({ op: 'set', path, data: d }); },
    update(d) { return send({ op: 'update', path, data: d }); },
    delete() { return send({ op: 'delete', path }); },
    onSnapshot(next) { const f = () => next({ id: path.split('/').pop(), exists: !!store[path], data: () => store[path], metadata: {} }); subs.push(f); if (ready) setTimeout(f); return () => {}; }
  });
  return {
    remote: true, doc,
    collection: (c) => ({
      doc: (id) => doc(c + '/' + (id || newId())),
      async add(d) { const r = doc(c + '/' + newId()); await r.set(d); return r; },
      onSnapshot(next) { const f = () => next(snapCol(c)); subs.push(f); if (ready) setTimeout(f); return () => {}; }
    }),
    async start() { await pull(); loop(); }
  };
}
async function bootRemote() {
  S.db = RemoteDB(COCKPIT); S.uid = COCKPIT.user; S.handle = COCKPIT.user; S.online = true; S.canWrite = true;
  ls.set('nobrayn-pilot', S.handle);
  subscribeAll();
  await S.db.start();
  render();
}
