// Cliffwalkers — les niveaux. Chaque niveau a sa solution (ordres { id, skill, age | x }) vérifiée par les tests.
// Terrain : r = rectangle [x, y, l, h], c = cercle [cx, cy, rayon], p = pente [x, y, l, h] ; m = matériau (1 terre, 2 acier, 3 eau, 0 vide).

export const LEVELS = [
  {
    id: 1, name: { fr: 'Le mur', en: 'The wall' }, hint: { fr: 'Un mur les arrête. Le Foreur est déjà choisi : touchez le sol juste devant le mur pour y planter un repère. Le premier marcheur qui passera dessus percera le mur.', en: 'A wall stops them. The Basher is already selected: tap the ground right in front of the wall to plant a marker. The first walker to pass over it will tunnel through.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 120,
    entrance: { x: 30, y: 50, dir: 1 }, exit: { x: 272, y: 76, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 40, 20, 60] }],
    skills: { basher: 3 }, solution: [{ skill: 'basher', place: [145, 99] }],
  },
  {
    id: 2, name: { fr: 'Le gouffre', en: 'The gap' }, hint: { fr: 'Choisissez le Bâtisseur et touchez le sol au bord du gouffre : le premier marcheur qui passera bâtira un pont en escalier jusqu\'à l\'autre côté.', en: 'Pick the Builder and tap the ground at the edge of the gap: the first walker to pass will build a staircase bridge to the other side.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 150,
    entrance: { x: 30, y: 60, dir: 1 }, exit: { x: 272, y: 52, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 140, 76] }, { r: [186, 76, 134, 100] }],
    skills: { builder: 3 }, solution: [{ skill: 'builder', place: [136, 99] }],
  },
  {
    id: 3, name: { fr: 'Haute voltige', en: 'High dive' }, hint: { fr: 'La chute est mortelle : choisissez le Parachutiste et touchez l\'air sous le bord de la plateforme, là où ils tombent. Tous les marcheurs qui y passeront recevront un parachute.', en: 'The fall is deadly: pick the Floater and tap the air below the platform edge, where they fall. Every walker passing there gets a parachute.' },
    w: 320, h: 176, count: 10, need: 8, rate: 40, time: 120,
    entrance: { x: 40, y: 10, dir: 1 }, exit: { x: 272, y: 126, w: 12, h: 24 },
    terrain: [{ r: [0, 150, 320, 26] }, { r: [20, 30, 50, 8] }],
    skills: { floater: 10 }, solution: [{ skill: 'floater', place: [70, 90] }],
  },
  {
    id: 4, name: { fr: 'Pilier', en: 'Pillar' }, hint: { fr: 'Choisissez le Creuseur et touchez le sol au milieu du plateau : le premier marcheur qui passera creusera vers la salle du dessous.', en: 'Pick the Digger and tap the ground in the middle of the plateau: the first walker to pass will dig down to the room below.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 150,
    entrance: { x: 30, y: 40, dir: 1 }, exit: { x: 272, y: 106, w: 12, h: 24 },
    terrain: [{ r: [0, 80, 320, 96] }, { r: [60, 110, 250, 20], m: 0 }],
    skills: { digger: 2 }, solution: [{ skill: 'digger', place: [150, 79] }],
  },
  {
    id: 5, name: { fr: 'Falaise', en: 'The cliff' }, hint: { fr: 'Le Grimpeur escalade les murs : touchez le sol avant le mur, tous les marcheurs qui passeront deviendront grimpeurs.', en: 'Climbers scale walls: tap the ground before the wall, every walker passing there becomes a climber.' },
    w: 320, h: 176, count: 10, need: 8, rate: 40, time: 150,
    entrance: { x: 30, y: 50, dir: 1 }, exit: { x: 272, y: 76, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 320, 76] }, { r: [150, 50, 14, 50] }],
    skills: { climber: 10 }, solution: [{ skill: 'climber', place: [138, 99] }],
  },
  {
    id: 6, name: { fr: 'Barrage', en: 'The dam' }, hint: { fr: 'Le vide les attend à droite : choisissez le Bloqueur et touchez directement le premier marcheur près du bord, les autres feront demi-tour.', en: 'The void waits on the right: pick the Blocker and tap the first walker itself near the edge, the others will turn around.' },
    w: 320, h: 176, count: 10, need: 8, rate: 40, time: 150,
    entrance: { x: 70, y: 40, dir: 1 }, exit: { x: 8, y: 76, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 200, 76] }],
    skills: { blocker: 1 }, solution: [{ id: 0, skill: 'blocker', x: 186 }],
  },
  {
    id: 7, name: { fr: 'Mine d\'or', en: 'Gold mine' }, hint: { fr: 'Le Mineur creuse en diagonale : touchez le sol au bord du plateau, le premier marcheur qui passera creusera vers la salle cachée.', en: 'The Miner digs diagonally: tap the ground at the plateau edge, the first walker to pass will dig toward the hidden room.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 180,
    entrance: { x: 30, y: 30, dir: 1 }, exit: { x: 192, y: 126, w: 12, h: 24 },
    terrain: [{ r: [0, 70, 100, 106] }, { r: [100, 70, 160, 80] }, { r: [0, 150, 320, 26] }, { r: [140, 125, 80, 25], m: 0 }, { r: [100, 150, 200, 4], m: 2 }],
    skills: { miner: 2, digger: 1 }, solution: [{ skill: 'miner', place: [97, 69] }],
  },
  {
    id: 8, name: { fr: 'Double jeu', en: 'Double act' }, hint: { fr: 'Deux obstacles : un gouffre, puis un mur. Un repère Bâtisseur au bord du gouffre, un repère Foreur devant le mur.', en: 'Two obstacles: a gap, then a wall. A Builder marker at the edge of the gap, a Basher marker in front of the wall.' },
    w: 320, h: 176, count: 10, need: 8, rate: 50, time: 200,
    entrance: { x: 30, y: 60, dir: 1 }, exit: { x: 288, y: 52, w: 12, h: 24 },
    terrain: [{ r: [0, 100, 120, 76] }, { r: [166, 76, 154, 100] }, { r: [236, 36, 14, 40] }],
    skills: { builder: 3, basher: 2 }, solution: [{ skill: 'builder', place: [116, 99] }, { skill: 'basher', place: [232, 75] }],
  },
];
