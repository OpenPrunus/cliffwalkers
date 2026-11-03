// Cliffwalkers — les niveaux. Chaque niveau a sa solution (ordres { id, skill, age | x }) vérifiée par les tests.
// Terrain : r = rectangle [x, y, l, h], c = cercle [cx, cy, rayon], p = pente [x, y, l, h] ; m = matériau (1 terre, 2 acier, 3 eau, 0 vide).

export const LEVELS = [
  {
    id: 1, name: { fr: 'Premiers pas', en: 'First steps' }, hint: { fr: 'Rien à faire : regardez-les marcher jusqu\'à la porte.', en: 'Nothing to do: just watch them walk to the door.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 90,
    entrance: { x: 30, y: 40, dir: 1 }, exit: { x: 272, y: 56, w: 12, h: 24 },
    terrain: [{ r: [0, 80, 320, 96] }, { r: [140, 74, 30, 6] }],
    skills: {}, solution: [],
  },
  {
    id: 2, name: { fr: 'Le mur', en: 'The wall' }, hint: { fr: 'Un mur les arrête : le foreur (horizontal) ouvre un tunnel.', en: 'A wall stops them: the basher tunnels through it.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 120,
    entrance: { x: 30, y: 50, dir: 1 }, exit: { x: 272, y: 76, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 40, 20, 60] }],
    skills: { basher: 3 }, solution: [{ id: 0, skill: 'basher', x: 146 }],
  },
  {
    id: 3, name: { fr: 'Le gouffre', en: 'The gap' }, hint: { fr: 'Le bâtisseur construit un escalier de 12 marches : il en faudra deux.', en: 'The builder lays a 12-step staircase: you will need two.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 150,
    entrance: { x: 30, y: 60, dir: 1 }, exit: { x: 272, y: 52, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 140, 76] }, { r: [186, 76, 134, 100] }],
    skills: { builder: 3 }, solution: [{ id: 0, skill: 'builder', x: 136 }, { id: 0, skill: 'builder', x: 160 }],
  },
  {
    id: 4, name: { fr: 'Haute voltige', en: 'High dive' }, hint: { fr: 'La chute est mortelle : donnez un parachute à chacun.', en: 'The fall is deadly: give everyone a parachute.' },
    w: 320, h: 176, count: 10, need: 8, rate: 40, time: 120,
    entrance: { x: 40, y: 10, dir: 1 }, exit: { x: 272, y: 126, w: 12, h: 24 },
    terrain: [{ r: [0, 150, 320, 26] }, { r: [20, 30, 50, 8] }],
    skills: { floater: 10 }, solution: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({ id, skill: 'floater', age: 2 })),
  },
  {
    id: 5, name: { fr: 'Pilier', en: 'Pillar' }, hint: { fr: 'Creusez vers le bas pour rejoindre la salle du dessous.', en: 'Dig down to reach the room below.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 150,
    entrance: { x: 30, y: 40, dir: 1 }, exit: { x: 272, y: 106, w: 12, h: 24 },
    terrain: [{ r: [0, 80, 320, 96] }, { r: [60, 110, 250, 20], m: 0 }],
    skills: { digger: 2 }, solution: [{ id: 0, skill: 'digger', x: 150 }],
  },
  {
    id: 6, name: { fr: 'Falaise', en: 'The cliff' }, hint: { fr: 'Le grimpeur escalade les murs : il le faut pour tous.', en: 'Climbers scale walls: everyone needs the skill.' },
    w: 320, h: 176, count: 10, need: 8, rate: 40, time: 150,
    entrance: { x: 30, y: 50, dir: 1 }, exit: { x: 272, y: 76, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 50, 14, 50] }],
    skills: { climber: 10 }, solution: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({ id, skill: 'climber', age: 2 })),
  },
  {
    id: 7, name: { fr: 'Barrage', en: 'The dam' }, hint: { fr: 'Le vide les attend à droite : un bloqueur les fait faire demi-tour.', en: 'The void waits on the right: a blocker turns them around.' },
    w: 320, h: 176, count: 10, need: 8, rate: 40, time: 150,
    entrance: { x: 70, y: 40, dir: 1 }, exit: { x: 8, y: 76, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 200, 76] }],
    skills: { blocker: 1 }, solution: [{ id: 0, skill: 'blocker', x: 186 }],
  },
  {
    id: 8, name: { fr: 'Mine d\'or', en: 'Gold mine' }, hint: { fr: 'Le mineur creuse en diagonale vers la salle cachée.', en: 'The miner digs diagonally to the hidden room.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 180,
    entrance: { x: 30, y: 30, dir: 1 }, exit: { x: 192, y: 126, w: 12, h: 24 },
    terrain: [{ r: [0, 70, 100, 106] }, { r: [100, 70, 160, 80] }, { r: [0, 150, 320, 26] }, { r: [140, 125, 80, 25], m: 0 }, { r: [100, 150, 200, 4], m: 2 }],
    skills: { miner: 2, digger: 1 }, solution: [{ id: 0, skill: 'miner', x: 99 }],
  },
];
