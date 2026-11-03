// Cliffwalkers — dessin : terrain (une image mise à jour quand il change), porte, trappe et petits marcheurs en pixels.
import { DIRT, STEEL, WATER, AIR } from './engine.js';

const SKY_TOP = '#5db7f2';
const SKY_BOTTOM = '#d3eefc';

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    canvas.width = game.terrain.w;
    canvas.height = game.terrain.h;
    this.layer = document.createElement('canvas');
    this.layer.width = game.terrain.w;
    this.layer.height = game.terrain.h;
    this.lctx = this.layer.getContext('2d');
    this.img = this.lctx.createImageData(game.terrain.w, game.terrain.h);
    this.rev = -1;
    this.sky = this.ctx.createLinearGradient(0, 0, 0, canvas.height);
    this.sky.addColorStop(0, SKY_TOP);
    this.sky.addColorStop(1, SKY_BOTTOM);
  }

  paintTerrain() {
    const t = this.game.terrain;
    const d = this.img.data;
    for (let y = 0; y < t.h; y++) {
      for (let x = 0; x < t.w; x++) {
        const v = t.m[y * t.w + x];
        const i = (y * t.w + x) * 4;
        let r = 0; let g = 0; let b = 0; let a = 255;
        if (v === DIRT) {
          if (y === 0 || t.m[(y - 1) * t.w + x] === AIR) { r = 76; g = 175; b = 80; } else if ((x * 7 + y * 13) % 11 === 0) { r = 110; g = 70; b = 36; } else { r = 141; g = 90; b = 43; }
        } else if (v === STEEL) {
          if (x % 8 === 3 && y % 8 === 3) { r = 220; g = 228; b = 232; } else { r = 140; g = 152; b = 164; }
        } else if (v === WATER) { r = 47; g = 125; b = 225; a = 230; } else a = 0;
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
      }
    }
    this.lctx.putImageData(this.img, 0, 0);
    this.rev = t.rev;
  }

  draw(hover, tick) {
    const { ctx, game } = this;
    const t = game.terrain;
    if (this.rev !== t.rev) this.paintTerrain();
    ctx.fillStyle = this.sky;
    ctx.fillRect(0, 0, t.w, t.h);
    ctx.drawImage(this.layer, 0, 0);
    this.drawHatch(tick);
    this.drawExit(tick);
    for (const l of game.lems) if (l.state !== 'dead' && l.state !== 'saved') this.drawLemming(l, tick);
    if (hover) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(hover.x - 6.5, hover.y - 12.5, 13, 16);
    }
  }

  drawHatch(tick) {
    const { ctx } = this;
    const e = this.game.level.entrance;
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(e.x - 11, e.y - 20, 22, 6);
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(e.x - 8, e.y - 15, 16, 2);
    if (this.game.released < this.game.total && !this.game.nuked) {
      ctx.fillStyle = '#ffcc80';
      ctx.fillRect(e.x - 5 + ((tick >> 3) % 3), e.y - 13, 2, 1);
    }
  }

  drawExit(tick) {
    const { ctx } = this;
    const ex = this.game.level.exit;
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(ex.x, ex.y + 6, ex.w, ex.h - 6);
    ctx.fillRect(ex.x + 2, ex.y + 3, ex.w - 4, 3);
    ctx.fillRect(ex.x + 4, ex.y, ex.w - 8, 3);
    ctx.fillStyle = (tick >> 3) % 2 ? '#ffd54f' : '#ffe082';
    ctx.fillRect(ex.x + 3, ex.y + 9, ex.w - 6, ex.h - 9);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(ex.x + ex.w - 3, ex.y - 6 + ((tick >> 4) % 2), 4, 3);
    ctx.fillRect(ex.x + ex.w - 4, ex.y - 6, 1, 7);
  }

  drawLemming(l, tick) {
    const { ctx } = this;
    const x = l.x;
    const y = l.y;
    const d = l.dir;
    const phase = (tick >> 2) & 1;
    const px = (rx, ry, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + rx, y + ry, w, h); };
    if (l.state === 'climb') {
      px(d * 2 - (d > 0 ? 1 : 0), -8, 2, 8, '#3a5fd9');
      px(-d * 1 - 1, -8, 3, 3, '#ffd6a5');
      px(-d * 1 - 1, -8, 3, 1, '#38c172');
      px(d * 2, -7 - phase, 2, 1, '#ffd6a5');
      return;
    }
    // jambes
    if (l.state === 'walk' || l.state === 'bash' || l.state === 'mine' || l.state === 'build') {
      px(-2, -1, 1, 1 + phase, '#2b3a8c');
      px(1, -1, 1, 2 - phase, '#2b3a8c');
    } else px(-2, -1, 4, 1, '#2b3a8c');
    px(-2, -5, 4, 4, '#3a5fd9');                 // corps
    px(-2, -8, 4, 3, '#ffd6a5');                 // tête
    px(-2, -8, 4, 1, '#38c172');                 // cheveux
    px(d > 0 ? 1 : -2, -7, 1, 1, '#1a1a1a');     // œil
    if (l.state === 'fall') { px(-3, -8, 1, 3, '#ffd6a5'); px(2, -8, 1, 3, '#ffd6a5'); }
    if (l.floater && l.state === 'fall' && l.fall >= 16) { px(-4, -13, 8, 2, '#fafafa'); px(-5, -12, 1, 1, '#fafafa'); px(4, -12, 1, 1, '#fafafa'); px(0, -11, 1, 3, '#9e9e9e'); }
    if (l.state === 'block') px(-4, -5, 8, 1, '#ffd6a5');
    if (l.state === 'dig') px(-1, 0, 3, 2, '#9e9e9e');
    if (l.state === 'bash') px(d * 3, -5, 2, 2, '#ffd6a5');
    if (l.state === 'mine') px(d * 3, -3, 2, 3, '#9e9e9e');
    if (l.state === 'build') px(d * 2, -4, 3, 2, '#ef6c00');
    if (l.climber) px(-1, -9, 2, 1, '#ffb300');
    if (l.fuse > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.ceil(l.fuse / 30)), x, y - 11);
    }
  }
}
