// Cliffwalkers — interface : écrans, boucle de jeu à 30 pas par seconde, souris, doigt et clavier.
import { Game, SKILLS, TPS } from './engine.js';
import { LEVELS } from './levels.js';
import { Renderer } from './render.js';
import * as audio from './audio.js';
import * as i18n from './i18n.js';

const { t } = i18n;
const $ = (sel) => document.querySelector(sel);

const ICONS = { climber: '🧗', floater: '☂️', bomber: '💣', blocker: '✋', builder: '🧱', basher: '👊', miner: '⛏️', digger: '🕳️' };
const SCREENS = ['title', 'levels', 'help', 'game'];

// ---------------------------------------------------------------- progression (gardée dans le navigateur)
const progress = { v: 2, best: {} };
try { Object.assign(progress, JSON.parse(localStorage.getItem('cliffwalkers.progress') ?? '{}')); } catch { /* stockage indisponible */ }
if (progress.v !== 2) { progress.v = 2; progress.best = {}; }                // les niveaux ont été renumérotés : on repart de zéro
const saveProgress = () => { try { localStorage.setItem('cliffwalkers.progress', JSON.stringify(progress)); } catch { /* ignoré */ } };
const cleared = (i) => progress.best[LEVELS[i].id] !== undefined && progress.best[LEVELS[i].id] >= LEVELS[i].need;
const unlocked = (i) => i === 0 || cleared(i - 1);
const firstOpen = () => { for (let i = 0; i < LEVELS.length; i++) if (!cleared(i)) return i; return LEVELS.length - 1; };

// ---------------------------------------------------------------- état
const app = { idx: 0, game: null, renderer: null, selected: null, paused: true, fast: false, hover: null, resultTimer: null, acc: 0, last: 0, coarse: false };

function show(name) {
  for (const id of SCREENS) $(`#${id}`).hidden = id !== name;
}

function refreshLabels() {
  i18n.apply();
  $('#opt-sound').textContent = t(audio.isMuted() ? 'soundOff' : 'soundOn');
  $('#opt-lang').textContent = t('langToggle');
  $('#btn-continue').textContent = Object.keys(progress.best).length > 0 ? t('continue') : t('play');
  buildLevelGrid();
  if (app.game) { buildSkills(); updateBar(); $('#hint').textContent = i18n.pick(app.game.level.hint); $('#brief-hint').textContent = i18n.pick(app.game.level.hint); }
}

// ---------------------------------------------------------------- niveaux
function buildLevelGrid() {
  const grid = $('#level-grid');
  grid.replaceChildren();
  LEVELS.forEach((lv, i) => {
    const b = document.createElement('button');
    b.className = `level-card${cleared(i) ? ' done' : ''}`;
    b.disabled = !unlocked(i);
    const n = document.createElement('b');
    n.textContent = t('level', { n: lv.id });
    const name = document.createElement('span');
    name.textContent = i18n.pick(lv.name);
    const info = document.createElement('small');
    info.textContent = !unlocked(i) ? t('locked') : progress.best[lv.id] !== undefined ? t('bestSaved', { n: progress.best[lv.id] }) : `${lv.need}/${lv.count}`;
    b.append(n, name, info);
    b.addEventListener('click', () => { audio.unlock(); audio.play('click'); startLevel(i); });
    grid.append(b);
  });
}

function startLevel(i) {
  clearTimeout(app.resultTimer);
  app.idx = i;
  app.game = new Game(LEVELS[i]);
  app.renderer = new Renderer($('#canvas'), app.game);
  app.paused = true;
  app.fast = false;
  app.acc = 0;
  app.selected = SKILLS.find((s) => (app.game.skills[s] ?? 0) > 0) ?? null;
  const lv = LEVELS[i];
  $('#lvl-name').textContent = `${t('level', { n: lv.id })} · ${i18n.pick(lv.name)}`;
  $('#brief-title').textContent = i18n.pick(lv.name);
  $('#brief-hint').textContent = i18n.pick(lv.hint);
  $('#hint').textContent = i18n.pick(lv.hint);
  $('#brief-goal').textContent = t('briefing', { need: lv.need, count: lv.count });
  $('#briefing').hidden = false;
  $('#result').hidden = true;
  $('#btn-fast').classList.remove('on');
  $('#btn-pause').classList.remove('on');
  show('game');
  buildSkills();
  updateBar();
}

function begin() {
  $('#briefing').hidden = true;
  app.paused = false;
  audio.unlock();
}

// ---------------------------------------------------------------- barre du haut et compétences
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function updateBar() {
  const g = app.game;
  $('#st-out').textContent = String(g.released);
  $('#st-saved').textContent = String(g.saved);
  $('#st-need').textContent = String(g.need);
  const left = g.level.time ? Math.max(0, g.level.time - Math.floor(g.tick / TPS)) : 0;
  $('#st-time').textContent = fmt(left);
  $('#rate').textContent = String(g.rate);
  for (const b of document.querySelectorAll('.skill')) {
    const n = g.skills[b.dataset.skill] ?? 0;
    b.querySelector('.cnt').textContent = String(n);
    b.disabled = n <= 0;
    b.classList.toggle('sel', app.selected === b.dataset.skill && n > 0);
  }
  if (app.selected && (g.skills[app.selected] ?? 0) <= 0) app.selected = SKILLS.find((s) => (g.skills[s] ?? 0) > 0) ?? null;
}

function buildSkills() {
  const bar = $('#skills');
  bar.replaceChildren();
  // seules les compétences du niveau sont proposées (les autres ne serviraient à rien)
  const offered = SKILLS.filter((s) => (app.game.level.skills[s] ?? 0) > 0);
  bar.style.setProperty('--n', String(offered.length));
  for (const s of offered) {
    const b = document.createElement('button');
    b.className = 'skill';
    b.dataset.skill = s;
    b.setAttribute('aria-label', t(`skill_${s}`));
    b.title = `${t(`skill_${s}`)} (${SKILLS.indexOf(s) + 1})`;
    const ico = document.createElement('span');
    ico.className = 'ico';
    ico.textContent = ICONS[s];
    const nm = document.createElement('span');
    nm.className = 'nm';
    nm.textContent = t(`skill_${s}`);
    const cnt = document.createElement('span');
    cnt.className = 'cnt';
    b.append(ico, nm, cnt);
    b.addEventListener('click', () => { audio.unlock(); audio.play('click'); app.selected = s; updateBar(); });
    bar.append(b);
  }
}

// ---------------------------------------------------------------- fin de partie
function showResult() {
  const g = app.game;
  const lv = LEVELS[app.idx];
  const won = g.won;
  if (won) {
    progress.best[lv.id] = Math.max(progress.best[lv.id] ?? 0, g.saved);
    saveProgress();
    buildLevelGrid();
  }
  $('#res-title').textContent = t(won ? 'won' : 'lost');
  const last = app.idx === LEVELS.length - 1;
  $('#res-detail').textContent = [t(won ? 'wonDetail' : 'lostDetail', { saved: g.saved, count: g.total, need: g.need }), !won && g.tick >= (lv.time ?? Infinity) * TPS ? t('lostTime') : '', won && last ? t('finished') : ''].filter(Boolean).join(' ');
  const main = $('#res-main');
  if (won && !last) { main.textContent = t('next'); main.dataset.action = 'next'; } else { main.textContent = t('retry'); main.dataset.action = 'restart'; }
  $('#result').hidden = false;
  audio.play(won ? 'win' : 'lose');
}

function handleEvents() {
  for (const e of app.game.events) {
    if (['spawn', 'save', 'splat', 'boom', 'drown', 'void'].includes(e.type)) audio.play(e.type);
  }
  app.game.events.length = 0;
}

// ---------------------------------------------------------------- boucle
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(100, now - (app.last || now));
  app.last = now;
  const g = app.game;
  if (!g || $('#game').hidden) return;
  if (!app.paused && !g.over) {
    app.acc += dt * (app.fast ? 3 : 1);
    const stepMs = 1000 / TPS;
    let guard = 0;
    while (app.acc >= stepMs && !g.over && guard++ < 12) {
      g.step();
      app.acc -= stepMs;
    }
    handleEvents();
    updateBar();
    if (g.over && $('#result').hidden && !app.resultTimer) app.resultTimer = setTimeout(() => { app.resultTimer = null; showResult(); }, 700);
  }
  app.renderer.draw(app.hover, g.tick);
}

// ---------------------------------------------------------------- pointeur
function levelPoint(e) {
  const r = $('#canvas').getBoundingClientRect();
  return { x: ((e.clientX - r.left) * app.game.terrain.w) / r.width, y: ((e.clientY - r.top) * app.game.terrain.h) / r.height };
}

$('#canvas').addEventListener('pointermove', (e) => {
  if (!app.game) return;
  app.coarse = e.pointerType === 'touch';
  const p = levelPoint(e);
  app.hover = app.game.pick(p.x, p.y, app.coarse ? 12 : 7);
});
$('#canvas').addEventListener('pointerleave', () => { app.hover = null; });
$('#canvas').addEventListener('pointerdown', (e) => {
  audio.unlock();
  const g = app.game;
  if (!g || !$('#briefing').hidden || g.over || !app.selected) return;       // on peut donner un ordre pendant la pause
  const p = levelPoint(e);
  const target = g.pick(p.x, p.y, e.pointerType === 'touch' ? 13 : 8);
  if (!target) return;
  if (g.assign(target.id, app.selected)) { audio.play('skill'); updateBar(); } else audio.play('refuse');
});

// ---------------------------------------------------------------- commandes
function togglePause() {
  if (!app.game || !$('#briefing').hidden) return;
  app.paused = !app.paused;
  $('#btn-pause').classList.toggle('on', app.paused);
}

const ACTIONS = {
  continue: () => startLevel(firstOpen()),
  levels: () => { clearTimeout(app.resultTimer); app.resultTimer = null; buildLevelGrid(); show('levels'); },
  help: () => show('help'),
  title: () => show('title'),
  begin,
  next: () => startLevel(Math.min(LEVELS.length - 1, app.idx + 1)),
  restart: () => { clearTimeout(app.resultTimer); app.resultTimer = null; startLevel(app.idx); begin(); },
  pause: togglePause,
  fast: () => { app.fast = !app.fast; $('#btn-fast').classList.toggle('on', app.fast); },
  nuke: () => { if (app.game && !app.paused) app.game.nuke(); },
  rateUp: () => { app.game?.setRate(app.game.rate + 10); updateBar(); },
  rateDown: () => { app.game?.setRate(app.game.rate - 10); updateBar(); },
  toggleSound: () => { audio.setMuted(!audio.isMuted()); refreshLabels(); },
  toggleLang: () => { i18n.setLang(i18n.getLang() === 'fr' ? 'en' : 'fr'); refreshLabels(); },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  audio.unlock();
  audio.play('click');
  ACTIONS[el.dataset.action]?.();
});

document.addEventListener('keydown', (e) => {
  if ($('#game').hidden) return;
  if (e.key >= '1' && e.key <= '8') { const s = SKILLS[Number(e.key) - 1]; if ((app.game.skills[s] ?? 0) > 0) { app.selected = s; updateBar(); } }
  else if (e.key === 'p' || e.key === 'P' || e.key === ' ') { e.preventDefault(); togglePause(); }
  else if (e.key === 'f' || e.key === 'F') ACTIONS.fast();
  else if (e.key === 'n' || e.key === 'N') ACTIONS.nuke();
  else if (e.key === '+' || e.key === '=') ACTIONS.rateUp();
  else if (e.key === '-') ACTIONS.rateDown();
  else if (e.key === 'r' || e.key === 'R') ACTIONS.restart();
  else if (e.key === 'Escape') ACTIONS.levels();
});

// ---------------------------------------------------------------- démarrage
i18n.setLang(i18n.detectLang());
refreshLabels();
show('title');
requestAnimationFrame(frame);

// Accès pour les tests de bout en bout dans le navigateur.
window.__cliff = { app, progress, LEVELS };
