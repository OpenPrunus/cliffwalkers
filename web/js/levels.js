// Cliffwalkers — les niveaux. Chaque niveau a sa solution (ordres { id, skill, age | x }) vérifiée par les tests.
// Terrain : r = rectangle [x, y, l, h], c = cercle [cx, cy, rayon], p = pente [x, y, l, h] ; m = matériau (1 terre, 2 acier, 3 eau, 0 vide).

export const LEVELS = [
  {
    id: 1, name: { fr: 'Le mur', en: 'The wall' }, hint: { fr: 'Un mur les arrête. Le Foreur est déjà choisi : touchez le premier marcheur quand il arrive devant le mur.', en: 'A wall stops them. The Basher is already selected: tap the first walker when it reaches the wall.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 120,
    entrance: { x: 30, y: 50, dir: 1 }, exit: { x: 272, y: 76, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 40, 20, 60] }],
    skills: { basher: 3 }, solution: [{ id: 0, skill: 'basher', x: 146 }],
  },
  {
    id: 2, name: { fr: 'Le gouffre', en: 'The gap' }, hint: { fr: 'Choisissez le Bâtisseur et touchez un marcheur au bord du gouffre : il construit 12 marches. Deux escaliers à la suite seront nécessaires.', en: 'Pick the Builder and tap a walker at the edge of the gap: it lays 12 steps. You will need two staircases in a row.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 150,
    entrance: { x: 30, y: 60, dir: 1 }, exit: { x: 272, y: 52, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 140, 76] }, { r: [186, 76, 134, 100] }],
    skills: { builder: 3 }, solution: [{ id: 0, skill: 'builder', x: 136 }, { id: 0, skill: 'builder', x: 160 }],
  },
  {
    id: 3, name: { fr: 'Haute voltige', en: 'High dive' }, hint: { fr: 'La chute est mortelle : choisissez le Parachutiste et touchez chaque marcheur dès sa sortie de la trappe.', en: 'The fall is deadly: pick the Floater and tap each walker as soon as it leaves the hatch.' },
    w: 320, h: 176, count: 10, need: 8, rate: 40, time: 120,
    entrance: { x: 40, y: 10, dir: 1 }, exit: { x: 272, y: 126, w: 12, h: 24 },
    terrain: [{ r: [0, 150, 320, 26] }, { r: [20, 30, 50, 8] }],
    skills: { floater: 10 }, solution: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({ id, skill: 'floater', age: 2 })),
  },
  {
    id: 4, name: { fr: 'Pilier', en: 'Pillar' }, hint: { fr: 'Choisissez le Creuseur et touchez un marcheur au milieu du sol : il creuse vers la salle du dessous.', en: 'Pick the Digger and tap a walker in the middle of the floor: it digs down to the room below.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 150,
    entrance: { x: 30, y: 40, dir: 1 }, exit: { x: 272, y: 106, w: 12, h: 24 },
    terrain: [{ r: [0, 80, 320, 96] }, { r: [60, 110, 250, 20], m: 0 }],
    skills: { digger: 2 }, solution: [{ id: 0, skill: 'digger', x: 150 }],
  },
  {
    id: 5, name: { fr: 'Falaise', en: 'The cliff' }, hint: { fr: 'Le Grimpeur escalade les murs : touchez chaque marcheur dès sa sortie pour lui donner ce talent.', en: 'Climbers scale walls: tap each walker right after it leaves the hatch to give it the skill.' },
    w: 320, h: 176, count: 10, need: 8, rate: 40, time: 150,
    entrance: { x: 30, y: 50, dir: 1 }, exit: { x: 272, y: 76, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 50, 14, 50] }],
    skills: { climber: 10 }, solution: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({ id, skill: 'climber', age: 2 })),
  },
  {
    id: 6, name: { fr: 'Barrage', en: 'The dam' }, hint: { fr: 'Le vide les attend à droite : transformez le premier marcheur en Bloqueur près du bord, les autres feront demi-tour.', en: 'The void waits on the right: turn the first walker into a Blocker near the edge, the others will turn around.' },
    w: 320, h: 176, count: 10, need: 8, rate: 40, time: 150,
    entrance: { x: 70, y: 40, dir: 1 }, exit: { x: 8, y: 76, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 200, 76] }],
    skills: { blocker: 1 }, solution: [{ id: 0, skill: 'blocker', x: 186 }],
  },
  {
    id: 7, name: { fr: 'Mine d\'or', en: 'Gold mine' }, hint: { fr: 'Le Mineur creuse en diagonale : touchez le premier marcheur au bord du plateau pour atteindre la salle cachée.', en: 'The Miner digs diagonally: tap the first walker at the plateau edge to reach the hidden room.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 180,
    entrance: { x: 30, y: 30, dir: 1 }, exit: { x: 192, y: 126, w: 12, h: 24 },
    terrain: [{ r: [0, 70, 100, 106] }, { r: [100, 70, 160, 80] }, { r: [0, 150, 320, 26] }, { r: [140, 125, 80, 25], m: 0 }, { r: [100, 150, 200, 4], m: 2 }],
    skills: { miner: 2, digger: 1 }, solution: [{ id: 0, skill: 'miner', x: 99 }],
  },
  {
    id: 8, name: { fr: 'Double jeu', en: 'Double act' }, hint: { fr: 'Deux obstacles : un gouffre, puis un mur. Bâtisseur pour le pont (deux fois), Foreur pour le mur.', en: 'Two obstacles: a gap, then a wall. Builder for the bridge (twice), Basher for the wall.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 200,
    entrance: { x: 30, y: 60, dir: 1 }, exit: { x: 288, y: 52, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 120, 76] }, { r: [166, 76, 154, 100] }, { r: [236, 36, 14, 40] }],
    skills: { builder: 3, basher: 2 }, solution: [{ id: 0, skill: 'builder', x: 116 }, { id: 0, skill: 'builder', x: 140 }, { id: 0, skill: 'basher', x: 232 }],
  },
];
