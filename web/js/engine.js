// Cliffwalkers — moteur de simulation. Entièrement déterministe (que des entiers, 30 pas par seconde) :
// le même niveau et les mêmes ordres donnent toujours la même partie, ce qui permet de tester chaque niveau avec sa solution.

export const TPS = 30;
export const AIR = 0;
export const DIRT = 1;
export const STEEL = 2;
export const WATER = 3;

export const SKILLS = ['climber', 'floater', 'bomber', 'blocker', 'builder', 'basher', 'miner', 'digger'];
const BODY = 8;            // hauteur d'un marcheur (pixels)
const STEP_UP = 6;         // marche franchissable sans aide
const DEADLY_FALL = 60;    // chute mortelle sans parachute (pixels)
const FUSE = 150;          // 5 secondes avant l'explosion
const BRICKS = 12;
const GROUNDED = new Set(['walk', 'dig', 'bash', 'mine', 'build', 'block']);

/** Le terrain : un tableau de pixels (air, terre, acier indestructible, eau mortelle). */
export class Terrain {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.m = new Uint8Array(w * h);
    this.rev = 0;                    // augmente à chaque creusement ou construction : le dessin sait quand se mettre à jour
  }

  get(x, y) {
    if (x < 0 || x >= this.w) return STEEL;           // les bords sont des murs
    if (y < 0 || y >= this.h) return AIR;
    return this.m[y * this.w + x];
  }

  solid(x, y) {
    const v = this.get(x, y);
    return v === DIRT || v === STEEL;
  }

  set(x, y, v) {
    if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.m[y * this.w + x] = v;
  }

  rect(x, y, w, h, mat) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, mat);
  }

  circle(cx, cy, r, mat) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) this.set(cx + i, cy + j, mat);
  }

  /** Triangle rectangle : la pente monte vers la droite (`dir` 1) ou vers la gauche (−1). */
  ramp(x, y, w, h, mat, dir = 1) {
    for (let i = 0; i < w; i++) {
      const col = dir === 1 ? i : w - 1 - i;
      const height = Math.ceil(((col + 1) * h) / w);
      for (let j = y + h - height; j < y + h; j++) this.set(x + i, j, mat);
    }
  }

  /** Creuse la terre d'un rectangle ; retourne { removed, steel }. */
  carveRect(x, y, w, h) {
    let removed = 0;
    let steel = false;
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        const v = this.get(i, j);
        if (v === DIRT) { this.set(i, j, AIR); removed++; this.rev++; } else if (v === STEEL && i >= 0 && i < this.w) steel = true;
      }
    }
    return { removed, steel };
  }

  carveCircle(cx, cy, r) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r && this.get(cx + i, cy + j) === DIRT) { this.set(cx + i, cy + j, AIR); this.rev++; }
  }

  /** Construit un bloc de `w` pixels (uniquement dans le vide). */
  brick(x, y, w) {
    for (let i = x; i < x + w; i++) if (this.get(i, y) === AIR) { this.set(i, y, DIRT); this.rev++; }
  }

  /** Y a-t-il de l'acier dans ce rectangle ? */
  hasSteel(x, y, w, h) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && i < this.w && this.get(i, j) === STEEL) return true;
    return false;
  }
}

/** Dessine le terrain d'un niveau à partir de sa description (rectangles, cercles, pentes ; les matériaux 0 effacent). */
export function buildTerrain(level) {
  const t = new Terrain(level.w, level.h);
  for (const op of level.terrain) {
    if (op.r) t.rect(op.r[0], op.r[1], op.r[2], op.r[3], op.m ?? DIRT);
    else if (op.c) t.circle(op.c[0], op.c[1], op.c[2], op.m ?? DIRT);
    else if (op.p) t.ramp(op.p[0], op.p[1], op.p[2], op.p[3], op.m ?? DIRT, op.dir ?? 1);
  }
  return t;
}

let nextId = 0;

export class Game {
  constructor(level) {
    this.level = level;
    this.terrain = buildTerrain(level);
    this.lems = [];
    this.tick = 0;
    this.released = 0;
    this.saved = 0;
    this.dead = 0;
    this.total = level.count;
    this.need = level.need;
    this.minRate = level.rate ?? 50;
    this.rate = this.minRate;
    this.skills = { ...Object.fromEntries(SKILLS.map((s) => [s, 0])), ...level.skills };
    this.nuked = false;
    this.over = false;
    this.won = false;
    this.nextSpawn = 0;
    this.events = [];
    nextId = 0;
  }

  get interval() {
    return Math.floor(((99 - this.rate) * 3) / 5) + 3;
  }

  setRate(rate) {
    this.rate = Math.max(this.minRate, Math.min(99, rate));
  }

  get alive() {
    return this.lems.filter((l) => l.state !== 'dead' && l.state !== 'saved');
  }

  emit(type, l) {
    this.events.push({ type, x: l?.x ?? 0, y: l?.y ?? 0 });
  }

  /** Un pas de simulation. */
  step() {
    if (this.over) return;
    this.tick++;
    if (!this.nuked && this.released < this.total && this.tick >= this.nextSpawn) {
      const e = this.level.entrance;
      this.lems.push({ id: this.released, x: e.x, y: e.y, dir: e.dir ?? 1, state: 'fall', fall: 0, floater: false, climber: false, fuse: 0, timer: 0, count: 0, idle: 0 });
      this.released++;
      this.nextSpawn = this.tick + this.interval;
      this.emit('spawn', { x: e.x, y: e.y });
    }
    for (const l of this.lems) if (l.state !== 'dead' && l.state !== 'saved') this.update(l);
    const living = this.alive.filter((l) => l.state !== 'block').length;          // un bloqueur ne retarde pas la fin du niveau
    const finished = (this.released === this.total || this.nuked) && living === 0;
    const timeUp = this.level.time && this.tick >= this.level.time * TPS;
    if (finished || timeUp) {
      this.over = true;
      this.won = this.saved >= this.need;
      this.emit(this.won ? 'win' : 'lose');
    }
  }

  die(l, why) {
    l.state = 'dead';
    this.dead++;
    this.emit(why, l);
  }

  update(l) {
    const t = this.terrain;
    if (l.fuse > 0 && --l.fuse === 0) {
      t.carveCircle(l.x, l.y - 4, 11);
      this.die(l, 'boom');
      return;
    }
    const ex = this.level.exit;
    if (l.x >= ex.x && l.x < ex.x + ex.w && l.y >= ex.y && l.y <= ex.y + ex.h) {
      l.state = 'saved';
      this.saved++;
      this.emit('save', l);
      return;
    }
    if (t.get(l.x, l.y) === WATER || t.get(l.x, l.y - 3) === WATER) { this.die(l, 'drown'); return; }
    if (GROUNDED.has(l.state) && !t.solid(l.x, l.y + 1)) { l.state = 'fall'; l.fall = 0; }     // le sol a disparu sous ses pieds (creusé, explosé…)
    switch (l.state) {
      case 'walk': this.walk(l); break;
      case 'fall': this.fall(l); break;
      case 'climb': this.climb(l); break;
      case 'dig': this.dig(l); break;
      case 'bash': this.bash(l); break;
      case 'mine': this.mine(l); break;
      case 'build': this.build(l); break;
      default: break;                       // block : ne bouge pas
    }
  }

  clear(x, y) {
    for (let r = 0; r < BODY; r++) if (this.terrain.solid(x, y - r)) return false;
    return true;
  }

  walk(l) {
    const t = this.terrain;
    const nx = l.x + l.dir;
    for (const b of this.lems) {
      if ((b.state === 'block' || b.state === 'build') && b !== l && Math.abs(b.x - nx) <= 3 && Math.abs(b.y - l.y) <= 6) { l.dir = -l.dir; return; }     // un bloqueur, ou un bâtisseur au travail, fait faire demi-tour
    }
    let up = -1;
    for (let u = 0; u <= STEP_UP; u++) if (this.clear(nx, l.y - u)) { up = u; break; }
    if (up < 0) {
      if (l.climber && t.get(nx, l.y) !== AIR) { l.state = 'climb'; return; }
      l.dir = -l.dir;
      return;
    }
    let ny = l.y - up;
    if (!t.solid(nx, ny + 1)) {
      let d = 1;
      while (d <= 3 && !t.solid(nx, ny + d + 1)) d++;
      if (d <= 3) ny += d;
    }
    l.x = nx;
    l.y = ny;
    if (!t.solid(nx, ny + 1)) { l.state = 'fall'; l.fall = 0; }
  }

  fall(l) {
    const t = this.terrain;
    const slow = l.floater && l.fall >= 16;
    const speed = slow ? 1 : 3;
    for (let i = 0; i < speed; i++) {
      if (t.solid(l.x, l.y + 1)) {
        if (l.fall > DEADLY_FALL && !l.floater) { this.die(l, 'splat'); return; }
        l.state = 'walk';
        l.fall = 0;
        return;
      }
      l.y++;
      l.fall++;
      if (t.get(l.x, l.y) === WATER) { this.die(l, 'drown'); return; }
      if (l.y > t.h + 8) { this.die(l, 'void'); return; }
    }
  }

  climb(l) {
    const t = this.terrain;
    if (t.solid(l.x, l.y - BODY)) { l.dir = -l.dir; l.state = 'fall'; l.fall = 0; return; }     // la tête heurte un plafond
    if (t.solid(l.x + l.dir, l.y)) { l.y--; return; }
    l.x += l.dir;                                                                              // en haut : on passe sur le rebord
    l.state = t.solid(l.x, l.y + 1) ? 'walk' : 'fall';
    l.fall = 0;
  }

  dig(l) {
    const t = this.terrain;
    if (++l.timer % 4 !== 0) return;
    if (t.hasSteel(l.x - 3, l.y + 1, 7, 1)) { l.state = 'walk'; return; }
    t.carveRect(l.x - 3, l.y + 1, 7, 1);
    l.y++;
    if (l.y > t.h) { this.die(l, 'void'); return; }
    if (!t.solid(l.x, l.y + 1)) { l.state = 'fall'; l.fall = 0; }
  }

  bash(l) {
    const t = this.terrain;
    if (++l.timer % 3 !== 0) return;
    const x0 = l.dir === 1 ? l.x + 1 : l.x - 3;
    if (t.hasSteel(x0, l.y - BODY + 1, 3, BODY)) { l.state = 'walk'; l.dir = -l.dir; return; }
    const { removed } = t.carveRect(x0, l.y - BODY + 1, 3, BODY);
    l.idle = removed === 0 ? l.idle + 1 : 0;
    if (l.idle >= 3) { l.state = 'walk'; return; }
    l.x += l.dir;
    if (!t.solid(l.x, l.y + 1)) {
      let d = 1;
      while (d <= 3 && !t.solid(l.x, l.y + d + 1)) d++;
      if (d <= 3) l.y += d; else { l.state = 'fall'; l.fall = 0; }
    }
  }

  mine(l) {
    const t = this.terrain;
    if (++l.timer % 5 !== 0) return;
    const x0 = l.dir === 1 ? l.x + 1 : l.x - 4;
    if (t.hasSteel(x0, l.y - BODY + 2, 4, BODY)) { l.state = 'walk'; l.dir = -l.dir; return; }
    const { removed } = t.carveRect(x0, l.y - BODY + 2, 4, BODY);
    l.idle = removed === 0 ? l.idle + 1 : 0;
    if (l.idle >= 2) { l.state = 'walk'; return; }
    l.x += l.dir * 2;
    l.y += 1;
    if (!t.solid(l.x, l.y + 1)) { l.state = 'fall'; l.fall = 0; }
  }

  build(l) {
    const t = this.terrain;
    if (++l.timer % 6 !== 0) return;
    if (l.count >= BRICKS) { l.state = 'walk'; return; }
    const x0 = l.dir === 1 ? l.x + 1 : l.x - 5;
    t.brick(x0, l.y, 5);
    const nx = l.x + l.dir * 2;
    if (!this.clear(nx, l.y - 1)) { l.state = 'walk'; l.dir = -l.dir; return; }
    l.x = nx;
    l.y -= 1;
    l.count++;
    if (l.count >= BRICKS) l.state = 'walk';
  }

  /** La condition pour donner une compétence à ce lemming (sans la consommer). */
  canAssign(l, skill) {
    if (!l || l.state === 'dead' || l.state === 'saved' || (this.skills[skill] ?? 0) <= 0) return false;
    switch (skill) {
      case 'climber': return !l.climber;
      case 'floater': return !l.floater;
      case 'bomber': return l.fuse === 0;
      default: return l.state === 'walk';
    }
  }

  /** Donne une compétence au lemming numéro `id` ; retourne vrai si elle a été utilisée. */
  assign(id, skill) {
    const l = this.lems[id];
    if (!this.canAssign(l, skill)) return false;
    switch (skill) {
      case 'climber': l.climber = true; break;
      case 'floater': l.floater = true; break;
      case 'bomber': l.fuse = FUSE; break;
      case 'blocker': l.state = 'block'; break;
      default: l.state = { builder: 'build', basher: 'bash', miner: 'mine', digger: 'dig' }[skill]; l.timer = 0; l.count = 0; l.idle = 0; break;
    }
    this.skills[skill]--;
    this.emit('skill', l);
    return true;
  }

  /** Tout le monde explose, l'un après l'autre. */
  nuke() {
    if (this.nuked) return;
    this.nuked = true;
    for (const l of this.alive) if (l.fuse === 0) l.fuse = FUSE - (l.id % 10) * 8;
  }

  /** Le lemming sous le pointeur (coordonnées du niveau), ou null. */
  pick(px, py, r = 7) {
    let best = null;
    let bestD = Infinity;
    for (const l of this.alive) {
      const dx = Math.abs(px - l.x);
      const dy = py - (l.y - 4);
      if (dx > r || Math.abs(dy) > r + 1) continue;
      const d = dx * dx + dy * dy;
      if (d < bestD) { best = l; bestD = d; }
    }
    return best;
  }
}

/**
 * Joue la solution d'un niveau : une liste d'ordres { id, skill, age } (n pas après la naissance du lemming `id`)
 * ou { id, skill, x } (dès qu'il atteint cette abscisse en marchant). Retourne la partie terminée.
 */
export function playSolution(level, solution = level.solution ?? [], maxTicks = 60 * TPS) {
  const g = new Game(level);
  const todo = solution.map((o) => ({ ...o }));
  while (!g.over && g.tick < maxTicks) {
    for (const o of todo) {
      if (o.done) continue;
      const l = g.lems[o.id];
      if (!l) continue;
      const ready = o.age !== undefined ? g.tick - o.born >= o.age : (o.dir === -1 ? l.x <= o.x : l.x >= o.x);
      if (o.born === undefined) o.born = g.tick;
      if (ready && g.assign(o.id, o.skill)) o.done = true;
    }
    g.step();
  }
  return g;
}
