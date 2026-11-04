import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, playSolution, SKILLS, AIR, TPS } from '../web/js/engine.js';
import { LEVELS } from '../web/js/levels.js';

test('chaque niveau est bien formé : entrée en l\'air, porte dans le décor, objectif atteignable, textes FR et EN', () => {
  assert.ok(LEVELS.length >= 8);
  LEVELS.forEach((lv, i) => {
    assert.equal(lv.id, i + 1);
    assert.ok(lv.need > 0 && lv.need <= lv.count, `niveau ${lv.id} : objectif`);
    assert.ok(lv.time >= 60, `niveau ${lv.id} : temps`);
    const g = new Game(lv);
    assert.equal(g.terrain.get(lv.entrance.x, lv.entrance.y), AIR, `niveau ${lv.id} : l'entrée est dans le vide`);
    assert.ok(lv.exit.x >= 0 && lv.exit.x + lv.exit.w <= lv.w && lv.exit.y >= 0 && lv.exit.y + lv.exit.h <= lv.h, `niveau ${lv.id} : porte`);
    for (const k of Object.keys(lv.skills)) assert.ok(SKILLS.includes(k), `compétence inconnue ${k}`);
    for (const f of ['name', 'hint']) assert.ok(lv[f].fr && lv[f].en, `niveau ${lv.id} : ${f}`);
  });
});

test('chaque niveau se gagne avec sa solution, bien avant la fin du temps', () => {
  for (const lv of LEVELS) {
    const g = playSolution(lv, lv.solution, lv.time * TPS);
    assert.equal(g.won, true, `niveau ${lv.id} « ${lv.name.fr} » : ${g.saved} sauvés sur ${lv.need} (morts : ${g.dead})`);
    assert.ok(g.tick < lv.time * TPS * 0.6, `niveau ${lv.id} : fini à ${Math.round(g.tick / TPS)} s sur ${lv.time}`);
  }
});

test('la solution n\'utilise que les compétences du niveau, et pas plus que le stock', () => {
  for (const lv of LEVELS) {
    const used = {};
    for (const o of lv.solution) used[o.skill] = (used[o.skill] ?? 0) + (o.place ? 1 : 1);
    for (const [k, n] of Object.entries(used)) assert.ok((lv.skills[k] ?? 0) >= n, `niveau ${lv.id} : ${k} ${n} > ${lv.skills[k] ?? 0}`);
  }
});

test('sans rien faire, aucun niveau ne se gagne : chacun demande bien ses compétences, et chacun en offre au moins une', () => {
  for (const lv of LEVELS) {
    const g = playSolution(lv, [], lv.time * TPS);
    assert.equal(g.won, false, `niveau ${lv.id} : ${g.saved} sauvés sans aide`);
    assert.ok(Object.values(lv.skills).some((n) => n > 0) && lv.solution.length > 0, `niveau ${lv.id} : au moins une compétence à utiliser`);
  }
});

test('une compétence inutile ne suffit pas : le niveau 1 (le mur) ne se gagne pas avec un parachute', () => {
  const lv = LEVELS[0];
  const g = playSolution({ ...lv, skills: { ...lv.skills, floater: 10 } }, [0, 1, 2].map((id) => ({ id, skill: 'floater', age: 2 })), lv.time * TPS);
  assert.equal(g.won, false);
});
