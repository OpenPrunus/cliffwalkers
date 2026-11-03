import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, Terrain, buildTerrain, DIRT, STEEL, AIR, WATER, TPS } from '../web/js/engine.js';

/** Un petit niveau de test : sol plat en y = 100, entrée à gauche, porte à droite. */
const level = (over = {}) => ({
  w: 320, h: 176, count: 1, need: 1, rate: 50,
  entrance: { x: 20, y: 90, dir: 1 }, exit: { x: 300, y: 76, w: 12, h: 24 },
  terrain: [{ r: [0, 100, 320, 76] }], skills: {}, ...over,
});
const run = (g, ticks) => { for (let i = 0; i < ticks && !g.over; i++) g.step(); return g; };
const first = (g) => g.lems[0];

test('le terrain : bords en acier, dessous vide, creuser, construire, acier indestructible', () => {
  const t = new Terrain(40, 40);
  t.rect(0, 20, 40, 20, DIRT);
  t.rect(10, 20, 4, 2, STEEL);
  assert.equal(t.get(-1, 5), STEEL);
  assert.equal(t.get(5, 99), AIR);
  const r = t.carveRect(8, 20, 8, 4);
  assert.equal(r.steel, true);
  assert.equal(t.get(10, 20), STEEL, 'l\'acier reste');
  assert.equal(t.get(8, 20), AIR);
  t.brick(0, 10, 5);
  assert.equal(t.get(2, 10), DIRT);
  const w = new Terrain(10, 10);
  w.ramp(0, 0, 10, 5, DIRT, 1);
  assert.equal(w.get(9, 4), DIRT);
  assert.equal(w.get(0, 0), AIR);
});

test('un marcheur sort de la trappe, tombe, marche et arrive à la porte', () => {
  const g = run(new Game(level()), 900);
  assert.equal(g.saved, 1);
  assert.equal(g.over && g.won, true);
});

test('il franchit une marche de 6 pixels mais rebrousse chemin devant un mur plus haut', () => {
  const ok = run(new Game(level({ terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 94, 20, 6] }] })), 900);
  assert.equal(ok.saved, 1, 'marche de 6 px');
  const wall = new Game(level({ terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 92, 20, 8] }] }));
  run(wall, 600);
  assert.equal(wall.saved, 0, 'marche de 8 px : demi-tour');
  assert.ok(first(wall).x < 150);
});

test('chute : plus de 60 pixels sans parachute est mortelle, avec parachute non', () => {
  const high = level({ entrance: { x: 20, y: 20, dir: 1 }, terrain: [{ r: [0, 100, 320, 76] }] });
  const dies = run(new Game(high), 200);
  assert.equal(dies.dead, 1);
  const g = new Game({ ...high, skills: { floater: 1 } });
  g.step();
  assert.equal(g.assign(0, 'floater'), true);
  run(g, 900);
  assert.equal(g.saved, 1);
});

test('le vide du bas du niveau et l\'eau tuent', () => {
  const pit = run(new Game(level({ terrain: [{ r: [0, 100, 40, 76] }] })), 600);
  assert.equal(pit.dead, 1);
  const water = run(new Game(level({ terrain: [{ r: [0, 100, 320, 76] }, { r: [60, 100, 40, 76], m: WATER }] })), 600);
  assert.equal(water.dead, 1);
});

test('creuseur : perce le sol vers le bas', () => {
  const g = new Game(level({ skills: { digger: 1 } }));
  run(g, 40);
  assert.equal(g.assign(0, 'digger'), true);
  run(g, 60);
  assert.ok(first(g).y > 100, 'il descend');
  assert.equal(g.terrain.get(first(g).x, 101), AIR);
});

test('creuseur : s\'arrête sur l\'acier', () => {
  const g = new Game(level({ skills: { digger: 1 }, terrain: [{ r: [0, 100, 320, 76] }, { r: [0, 106, 320, 4], m: STEEL }] }));
  run(g, 40);
  g.assign(0, 'digger');
  run(g, 200);
  assert.equal(first(g).state, 'walk');
  assert.ok(first(g).y <= 106);
});

test('foreur : traverse un mur, mais pas l\'acier', () => {
  const wall = new Game(level({ skills: { basher: 1 }, terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 40, 20, 60] }] }));
  run(wall, 130);
  assert.equal(wall.assign(0, 'basher'), true);
  run(wall, 700);
  assert.equal(wall.saved, 1);
  const steel = new Game(level({ skills: { basher: 1 }, terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 40, 20, 60], m: STEEL }] }));
  run(steel, 130);
  steel.assign(0, 'basher');
  run(steel, 400);
  assert.equal(steel.saved, 0);
});

test('mineur : descend en diagonale', () => {
  const g = new Game(level({ skills: { miner: 1 }, terrain: [{ r: [0, 100, 320, 76] }] }));
  run(g, 40);
  assert.equal(g.assign(0, 'miner'), true);
  const y0 = first(g).y;
  run(g, 100);
  assert.ok(first(g).y > y0 + 5 && first(g).x > 60);
});

test('bâtisseur : 12 marches en escalier, puis il reprend sa marche', () => {
  const g = new Game(level({ skills: { builder: 1 }, terrain: [{ r: [0, 100, 140, 76] }] }));
  run(g, 100);
  const x0 = first(g).x;
  const y0 = first(g).y;
  assert.equal(g.assign(0, 'builder'), true);
  run(g, 12 * 6);
  assert.equal(first(g).y, y0 - 12);
  assert.equal(first(g).x, x0 + 24);
  assert.equal(first(g).state, 'walk');
});

test('grimpeur : escalade un mur de 40 pixels', () => {
  const g = new Game(level({ skills: { climber: 1 }, terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 60, 14, 40] }] }));
  g.step();
  assert.equal(g.assign(0, 'climber'), true);
  run(g, 900);
  assert.equal(g.saved, 1);
});

test('bloqueur : fait faire demi-tour aux autres et ne retarde pas la fin du niveau', () => {
  const g = new Game(level({ count: 2, need: 1, skills: { blocker: 1 }, entrance: { x: 20, y: 95, dir: 1 }, terrain: [{ r: [0, 100, 200, 76] }] }));
  run(g, 60);
  assert.equal(g.assign(0, 'blocker'), true);
  run(g, 400);
  assert.equal(first(g).state, 'block');
  assert.ok(g.lems[1].x <= first(g).x, 'le suivant ne passe pas');
  const done = run(new Game(level({ count: 1, need: 0, skills: { blocker: 1 } })), 40);
  done.assign(0, 'blocker');
  run(done, 40);
  assert.equal(done.over, true);
});

test('kamikaze : explose au bout de 5 secondes et creuse un cratère ; tout faire exploser tue tout le monde', () => {
  const g = new Game(level({ skills: { bomber: 1 } }));
  run(g, 40);
  assert.equal(g.assign(0, 'bomber'), true);
  assert.equal(g.assign(0, 'bomber'), false, 'une seule fois');
  run(g, 5 * TPS + 2);
  assert.equal(first(g).state, 'dead');
  const n = new Game(level({ count: 5, need: 5 }));
  run(n, 120);
  n.nuke();
  run(n, 10 * TPS);
  assert.equal(n.dead + n.saved, n.released);
  assert.equal(n.over, true);
});

test('les compétences sont comptées et refusées sans stock ou mal placées', () => {
  const g = new Game(level({ skills: { digger: 1 } }));
  assert.equal(g.assign(0, 'digger'), false, 'personne n\'est sorti');
  g.step();
  assert.equal(g.assign(0, 'digger'), false, 'il tombe : pas encore au sol');
  run(g, 40);
  assert.equal(g.assign(0, 'basher'), false, 'plus de stock');
  assert.equal(g.assign(0, 'digger'), true);
  assert.equal(g.skills.digger, 0);
});

test('la cadence de sortie se règle, sans jamais descendre sous celle du niveau', () => {
  const g = new Game(level({ rate: 50 }));
  g.setRate(10);
  assert.equal(g.rate, 50);
  const slow = g.interval;
  g.setRate(99);
  assert.ok(g.interval < slow && g.interval >= 3);
});

test('pick : le marcheur sous le pointeur, avec une tolérance', () => {
  const g = new Game(level());
  run(g, 60);
  const l = first(g);
  assert.equal(g.pick(l.x, l.y - 4)?.id, 0);
  assert.equal(g.pick(l.x + 10, l.y - 4), null);
  assert.equal(g.pick(l.x + 10, l.y - 4, 12)?.id, 0);
});

test('le temps limite termine le niveau', () => {
  const g = run(new Game(level({ time: 2, count: 5, need: 5 })), 5 * TPS);
  assert.equal(g.over, true);
  assert.equal(g.won, false);
});

test('la simulation est déterministe : deux parties identiques donnent exactement le même état', () => {
  const play = () => {
    const g = new Game(level({ count: 6, need: 3, skills: { digger: 2 } }));
    for (let i = 0; i < 400; i++) { if (i === 70) g.assign(0, 'digger'); g.step(); }
    return JSON.stringify([g.lems, g.saved, g.dead, Array.from(g.terrain.m.slice(0, 20000))]);
  };
  assert.equal(play(), play());
  assert.ok(buildTerrain(level()).get(0, 100) === DIRT);
});
