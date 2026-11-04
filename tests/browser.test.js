// Navigateur : un vrai Chrome (headless) piloté par DevTools, sans dépendance. Le site est statique : un petit serveur Node le sert.
//   npm run test:browser          (CHROME_BIN réglable ; SHOTS=/dossier enregistre des captures d'écran)
import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  s.on('error', reject);
});
async function waitFor(fn, ms, what) {
  const t0 = Date.now();
  let last;
  for (;;) {
    try { last = await fn(); if (last) return last; } catch (e) { last = `erreur : ${e.message}`; }
    if (Date.now() - t0 > ms) throw new Error(`délai dépassé : ${what} (dernière valeur : ${JSON.stringify(last)})`);
    await sleep(50);
  }
}

let BASE, server, chrome, tmpDir, cdp, nextId = 0;
const pending = new Map();
const errors = [];

before(async () => {
  server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] ?? 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  const port = await freePort();
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  BASE = `http://localhost:${port}`;
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cliff-chrome-'));
  const dbg = await freePort();
  chrome = spawn(process.env.CHROME_BIN || 'google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run',
    `--remote-debugging-port=${dbg}`, `--user-data-dir=${tmpDir}`, 'about:blank',
  ], { stdio: 'ignore' });
  const tab = await waitFor(async () => (await (await fetch(`http://127.0.0.1:${dbg}/json`)).json()).find((t) => t.type === 'page'), 15000, 'Chrome');
  cdp = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { cdp.onopen = resolve; cdp.onerror = () => reject(new Error('DevTools')); });
  cdp.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(`${m.params.entry.text} ${m.params.entry.url ?? ''}`);
  };
  await call('Page.enable'); await call('Runtime.enable'); await call('Log.enable');
});
after(() => {
  try { cdp.close(); } catch { /* déjà fermé */ }
  try { chrome?.kill(); } catch { /* déjà arrêté */ }
  server?.close();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignoré */ }
});

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
    cdp.send(JSON.stringify({ id, method, params }));
  });
}
async function ev(expr) {
  const r = await call('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`page : ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
  return r.result.value;
}
async function shot(name) {
  if (!process.env.SHOTS) return;
  fs.mkdirSync(process.env.SHOTS, { recursive: true });
  const { data } = await call('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(process.env.SHOTS, `${name}.png`), Buffer.from(data, 'base64'));
}
const DESKTOP = { w: 1100, h: 760, touch: false };
const PHONE_PORTRAIT = { w: 390, h: 844, touch: true };
const PHONE_LANDSCAPE = { w: 844, h: 390, touch: true };

async function open(device, lang = 'fr', progress = null) {
  await call('Emulation.setDeviceMetricsOverride', { width: device.w, height: device.h, deviceScaleFactor: 1, mobile: !!device.touch });
  await call('Emulation.setTouchEmulationEnabled', device.touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await call('Storage.clearDataForOrigin', { origin: new URL(BASE).origin, storageTypes: 'local_storage' });
  await call('Page.navigate', { url: `${BASE}/` });
  await waitFor(() => ev('document.readyState === "complete" && !!window.__cliff'), 10000, 'page chargée');
  await ev(`localStorage.setItem('cliffwalkers.lang', ${JSON.stringify(lang)}); ${progress ? `localStorage.setItem('cliffwalkers.progress', ${JSON.stringify(JSON.stringify(progress))});` : ''} location.reload()`);
  await waitFor(() => ev('document.readyState === "complete" && !!window.__cliff'), 10000, 'page rechargée');
}
const click = (sel) => ev(`document.querySelector(${JSON.stringify(sel)}).click()`);
const visible = (sel) => ev(`!document.querySelector(${JSON.stringify(sel)}).hidden`);
const text = (sel) => ev(`document.querySelector(${JSON.stringify(sel)}).textContent`);
const game = () => ev('(() => { const g = window.__cliff.app.game; return { tick: g.tick, released: g.released, saved: g.saved, dead: g.dead, over: g.over, won: g.won, skills: g.skills }; })()');
const ALL_UNLOCKED = { v: 2, best: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10 } };

/** Un clic (souris ou doigt) sur le décor, aux coordonnées du niveau : plante un repère. */
async function tapLevel(x, y, touch) {
  const p = await ev(`(() => { const a = window.__cliff.app; const r = document.querySelector('#canvas').getBoundingClientRect(); return { x: r.left + (${x} / a.game.terrain.w) * r.width, y: r.top + (${y} / a.game.terrain.h) * r.height }; })()`);
  if (touch) {
    await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
    await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  }
}

/** Clic (souris ou doigt) sur le marcheur numéro id : on convertit sa position dans le niveau en position à l'écran. */
async function pointAt(id, touch) {
  const p = await ev(`(() => { const a = window.__cliff.app; const l = a.game.lems[${id}]; const r = document.querySelector('#canvas').getBoundingClientRect(); return { x: r.left + (l.x / a.game.terrain.w) * r.width, y: r.top + ((l.y - 4) / a.game.terrain.h) * r.height, st: l.state, lx: l.x }; })()`);
  if (touch) {
    await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
    await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  }
  return p;
}

/** Met la partie en pause à l'instant précis où le marcheur 0 atteint l'abscisse x (sondage toutes les 4 ms dans la page). */
const pauseAt = (x) => ev(`new Promise((resolve) => { const a = window.__cliff.app; const i = setInterval(() => { const l = a.game.lems[0]; if (l && l.x >= ${x}) { a.paused = true; document.querySelector('#btn-pause').classList.add('on'); clearInterval(i); resolve(true); } }, 4); })`);
const unpause = () => ev("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }))");

describe('pages et menus', () => {
  test('le menu s\'affiche, sans erreur, en français puis en anglais ; le niveau 2 est verrouillé', async () => {
    errors.length = 0;
    await open(DESKTOP);
    assert.equal(await ev('document.title'), 'Cliffwalkers');
    assert.match(await text('#btn-continue'), /Jouer/);
    assert.equal(await ev('document.querySelector("#title a.all").href'), 'https://games.prunus.dev/');
    await shot('title');
    await click('[data-action=levels]');
    assert.equal(await ev('document.querySelectorAll(".level-card").length >= 8'), true);
    assert.equal(await ev('document.querySelectorAll(".level-card")[0].disabled'), false);
    assert.equal(await ev('document.querySelectorAll(".level-card")[1].disabled'), true);
    await shot('levels');
    await open(DESKTOP, 'en');
    assert.match(await text('#btn-continue'), /Play/);
    assert.deepEqual(errors, []);
  });
});

describe('jouer', () => {
  test('niveau 1 (le mur) à la souris : briefing, seule la compétence utile est proposée, un repère planté devant le mur, victoire, niveau 2 débloqué', async () => {
    errors.length = 0;
    await open(DESKTOP);
    await click('#btn-continue');
    assert.equal(await visible('#briefing'), true);
    assert.match(await text('#brief-goal'), /8.*10/);
    assert.match(await text('#brief-hint'), /Foreur/);
    await click('[data-action=begin]');
    assert.equal(await ev('document.querySelectorAll(".skill").length'), 1, 'seul le foreur est proposé');
    assert.equal(await ev('document.querySelector(".skill").disabled'), false);
    assert.equal(await ev('document.querySelector(".skill").classList.contains("sel")'), true, 'et il est déjà choisi');
    assert.match(await text('#hint'), /Foreur/);
    await tapLevel(144, 99, false);                                           // un repère planté dans le sol devant le mur
    assert.equal(await ev('window.__cliff.app.game.markers.length'), 1);
    assert.equal((await game()).skills.basher, 2, 'le stock est réservé à la pose');
    await waitFor(() => ev('window.__cliff.app.game.lems.some((l) => l.state === "bash")'), 20000, 'le premier marcheur qui passe perce le mur');
    assert.equal(await ev('window.__cliff.app.game.markers.length'), 0, 'le repère est consommé');
    await shot('level1');
    await ev('window.__cliff.app.fast = true');                            // la suite se joue plus vite : le tunnel est ouvert
    await waitFor(() => visible('#result'), 40000, 'fin du niveau 1');
    assert.match(await text('#res-title'), /Bravo/);
    assert.equal(await ev('JSON.parse(localStorage.getItem("cliffwalkers.progress")).best[1]'), 10);
    await shot('won');
    await click('#res-main');
    assert.match(await text('#lvl-name'), /Niveau 2/);
    assert.deepEqual(errors, []);
  });

  test('toucher un repère le retire et rend le stock ; le bloqueur, lui, se donne en touchant le marcheur', async () => {
    await open(DESKTOP, 'fr', ALL_UNLOCKED);
    await click('[data-action=levels]');
    await ev('document.querySelectorAll(".level-card")[0].click()');
    await click('[data-action=begin]');
    await tapLevel(144, 99, false);
    assert.equal((await game()).skills.basher, 2);
    await tapLevel(144, 99, false);                                           // un second toucher au même endroit retire le repère
    assert.equal(await ev('window.__cliff.app.game.markers.length'), 0);
    assert.equal((await game()).skills.basher, 3, 'stock rendu');
    await click('[data-action=levels]');
    await ev('document.querySelectorAll(".level-card")[5].click()');       // « Barrage » : bloqueur
    await click('[data-action=begin]');
    assert.equal(await ev('document.querySelector(".skill").dataset.skill'), 'blocker');
    await waitFor(() => ev('window.__cliff.app.game.lems[0]?.x >= 150'), 20000, 'le premier marcheur approche du bord');
    await pauseAt(186);
    await pointAt(0, false);
    await unpause();
    await waitFor(() => ev('window.__cliff.app.game.lems[0].state === "block"'), 2000, 'le bloqueur bloque');
  });

  test('chaque niveau ne propose que ses compétences, dans l\'ordre habituel', async () => {
    await open(DESKTOP, 'fr', ALL_UNLOCKED);
    await click('[data-action=levels]');
    await ev('document.querySelectorAll(".level-card")[7].click()');       // « Double jeu » : bâtisseur et foreur
    await click('[data-action=begin]');
    assert.deepEqual(await ev('[...document.querySelectorAll(".skill")].map((b) => b.dataset.skill)'), ['builder', 'basher']);
  });

  test('un niveau raté propose de réessayer ; Échap et le clavier : pause, compétences, cadence', async () => {
    await open(DESKTOP, 'fr', ALL_UNLOCKED);
    await click('#btn-continue');
    await click('[data-action=begin]');
    const key = (k) => ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)} }))`);
    await key('p');
    const t0 = (await game()).tick;
    await sleep(300);
    assert.equal((await game()).tick, t0, 'en pause, rien ne bouge');
    await key('p');
    await sleep(300);
    assert.ok((await game()).tick > t0);
    await key('+');
    assert.equal(await text('#rate'), '60');
    await key('-');
    await key('-');
    assert.equal(await text('#rate'), '50', 'jamais sous la cadence du niveau');
    await key('n');                                                         // tout faire exploser : niveau raté
    await ev('window.__cliff.app.fast = true');
    await waitFor(() => visible('#result'), 30000, 'résultat');
    assert.match(await text('#res-title'), /Raté/);
    assert.match(await text('#res-main'), /Réessayer/);
    await click('#res-main');
    assert.equal(await visible('#result'), false);
    assert.equal((await game()).released <= 1, true, 'le niveau repart de zéro');
    await key('Escape');
    assert.equal(await visible('#levels'), true);
  });
});

describe('téléphone : tout tient à l\'écran et se joue au doigt', () => {
  for (const [name, device] of [['portrait', PHONE_PORTRAIT], ['paysage', PHONE_LANDSCAPE]]) {
    test(`${name} : la scène, les compétences et les commandes sont entières et sans défilement`, async () => {
      await open(device, 'fr', ALL_UNLOCKED);
      await click('[data-action=levels]');
      await ev('document.querySelectorAll(".level-card")[1].click()');
      await click('[data-action=begin]');
      const box = await ev(`(() => {
        const r = (s) => document.querySelector(s).getBoundingClientRect();
        const c = r('#canvas'); const sk = r('#skills'); const ct = r('#controls');
        return { cw: c.width, ch: c.height, ctop: c.top, skBottom: sk.bottom, ctBottom: ct.bottom, ctRight: ct.right, skW: sk.width, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, btn: document.querySelector('.skill').getBoundingClientRect().width };
      })()`);
      assert.ok(box.cw > device.w * (device.w > device.h ? 0.45 : 0.55), `scène de ${box.cw}px sur ${device.w}`);
      assert.ok(box.ctBottom <= device.h + 0.5, `commandes visibles : ${box.ctBottom} sur ${device.h}`);
      assert.ok(box.ctRight <= device.w + 0.5 && box.sw <= device.w, 'pas de défilement horizontal');
      assert.ok(box.sh <= device.h + 1, `pas de défilement vertical (${box.sh} sur ${device.h})`);
      assert.ok(box.btn >= 30, `bouton de compétence de ${box.btn}px`);
      await shot(`phone-${name}`);
    });
  }

  test('au doigt : un toucher sur le décor plante un repère que le premier marcheur exécute', async () => {
    await open(PHONE_PORTRAIT, 'fr', ALL_UNLOCKED);
    await click('[data-action=levels]');
    await ev('document.querySelectorAll(".level-card")[0].click()');
    await click('[data-action=begin]');
    await tapLevel(144, 99, true);
    await waitFor(() => ev('window.__cliff.app.game.lems.some((l) => l.state === "bash")'), 20000, 'le premier marcheur qui passe perce le mur');
  });
});

describe('hors ligne (PWA)', () => {
  test('après une première visite, la page se charge sans réseau et un niveau se joue', async () => {
    await open(DESKTOP);
    assert.equal(await ev('navigator.serviceWorker.ready.then(() => true)'), true);
    await call('Page.navigate', { url: `${BASE}/` });
    await waitFor(() => ev('!!window.__cliff && !!navigator.serviceWorker.controller'), 10000, 'page contrôlée par le service worker');
    await call('Network.enable');
    await call('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    try {
      await call('Page.navigate', { url: `${BASE}/` });
      await waitFor(() => ev('!!window.__cliff'), 8000, 'page chargée hors ligne');
      await click('#btn-continue');
      await click('[data-action=begin]');
      await waitFor(() => ev('window.__cliff.app.game.released >= 2'), 5000, 'le niveau tourne hors ligne');
    } finally {
      await call('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    }
  });
});
