// Purely cosmetic background: a scrolling, parallax field of stars, dust,
// nebula glow and tumbling debris meshes. It never collides with anything,
// is drawn first, and is kept dim and cool-colored so it can't be mistaken
// for enemies or their (warm-colored) bullets.
//
// Every particle has a depth z in 0 (far) .. 1 (near); depth scales speed,
// size, and brightness. Explosions give nearby dust and debris a shove
// (see shock()), and the nebula tint eases to a new hue each round.

// Debris meshes: polygons (with a shade 0..1) and line details, in units where
// the piece is roughly 30 across at full depth. hue gives its base color.
const DEBRIS_MESHES = [
  { name: 'asteroid A', hue: 25, sat: 8, r: 30,
    polys: [
      { pts: [[-26, -6], [-14, -24], [6, -28], [24, -14], [28, 6], [14, 24], [-4, 28], [-22, 18]], tone: 0.5 },
      { pts: [[-8, -10], [4, -14], [10, -4], [0, 2]], tone: 0.2 },
      { pts: [[8, 10], [18, 8], [16, 18], [8, 18]], tone: 0.25 },
    ] },
  { name: 'asteroid B', hue: 35, sat: 6, r: 36,
    polys: [
      { pts: [[-34, -8], [-18, -16], [8, -12], [30, -18], [36, 2], [18, 14], [-6, 10], [-26, 16]], tone: 0.5 },
      { pts: [[-12, -4], [-2, -6], [2, 2], [-10, 4]], tone: 0.2 },
    ] },
  { name: 'asteroid C', hue: 15, sat: 8, r: 18,
    polys: [
      { pts: [[-14, -4], [-6, -16], [8, -12], [16, 2], [6, 14], [-10, 12]], tone: 0.55 },
      { pts: [[-2, -4], [5, -2], [2, 5]], tone: 0.2 },
    ] },
  { name: 'solar panel', hue: 215, sat: 30, r: 34,
    polys: [{ pts: [[-30, -14], [30, -14], [30, 14], [-30, 14]], tone: 0.4 }],
    lines: [[-10, -14, -10, 14], [10, -14, 10, 14], [-30, 0, 30, 0]] },
  { name: 'satellite', hue: 210, sat: 12, r: 36,
    polys: [
      { pts: [[-8, -8], [8, -8], [8, 8], [-8, 8]], tone: 0.6 },
      { pts: [[-34, -6], [-10, -6], [-10, 6], [-34, 6]], tone: 0.35 },
      { pts: [[10, -6], [34, -6], [34, 6], [10, 6]], tone: 0.35 },
    ],
    lines: [[0, -8, 0, -22], [-22, -6, -22, 6], [22, -6, 22, 6]] },
  { name: 'hull plate', hue: 205, sat: 10, r: 32,
    polys: [{ pts: [[-28, -12], [10, -18], [30, -6], [24, 14], [-20, 16]], tone: 0.5 }],
    lines: [[-18, -8, 18, -8], [-14, 6, 20, 4], [-4, -12, -2, 12]] },
  { name: 'crystals', hue: 190, sat: 25, r: 28,
    polys: [
      { pts: [[-4, 14], [-8, -22], [2, 14]], tone: 0.6 },
      { pts: [[2, 14], [10, -14], [14, 14]], tone: 0.45 },
      { pts: [[-14, 14], [-20, -4], [-8, 14]], tone: 0.35 },
    ] },
  { name: 'wreck', hue: 220, sat: 10, r: 34,
    polys: [
      { pts: [[32, 0], [-18, -16], [-10, -2], [-14, 6], [-24, 18]], tone: 0.5 },
      { pts: [[-4, -6], [10, -2], [-4, 2]], tone: 0.2 },
    ],
    lines: [[-18, -16, -26, -20], [-24, 18, -30, 24]] },
];

const ATM_STARS = 150;
const ATM_DUST = 60;
const ATM_DEBRIS = 10;
const ATM_NEBULAE = 3;
const ATM_SCROLL = 1;          // overall scroll speed multiplier
const ATM_SHOCK_RADIUS = 160;
const ATM_MAX_PUSH = 5;

class Atmosphere {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.enabled = true;
    this.age = 0;
    this.hue = 215;          // current nebula tint, easing toward targetHue
    this.targetHue = 215;

    this.stars = Array.from({ length: ATM_STARS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random(),
      phase: Math.random() * Math.PI * 2,
    }));
    this.dust = Array.from({ length: ATM_DUST }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random(),
      phase: Math.random() * Math.PI * 2,
      sx: 0,
      sy: 0,
    }));
    this.nebulae = Array.from({ length: ATM_NEBULAE }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height + 400) - 200,
      r: 200 + Math.random() * 160,
      vy: 0.04 + Math.random() * 0.06,
      hueOffset: (Math.random() - 0.5) * 60,
    }));
    this.debris = Array.from({ length: ATM_DEBRIS }, () => this.newDebris(true));
  }
  newDebris(anywhere) {
    const z = 0.15 + Math.random() * 0.85;
    const mesh = DEBRIS_MESHES[Math.floor(Math.random() * DEBRIS_MESHES.length)];
    const scale = 0.5 + z * 0.9;
    return {
      mesh,
      z,
      scale,
      x: Math.random() * this.width,
      y: anywhere ? Math.random() * this.height : -mesh.r * scale - 20,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02,
      vx: (Math.random() - 0.5) * 0.4,
      sx: 0,
      sy: 0,
    };
  }
  setTheme(roundIndex) {
    this.targetHue = (200 + roundIndex * 47) % 360;
  }
  // Called for every explosion: shove nearby dust and debris away from it.
  shock(x, y, power = 3) {
    for (const list of [this.dust, this.debris]) {
      for (const p of list) {
        const dx = p.x - x;
        const dy = p.y - y;
        const d = Math.hypot(dx, dy);
        if (d > ATM_SHOCK_RADIUS || d === 0) continue;
        const k = (1 - d / ATM_SHOCK_RADIUS) ** 2 * power * (0.5 + p.z);
        p.sx = Math.max(-ATM_MAX_PUSH, Math.min(ATM_MAX_PUSH, p.sx + dx / d * k));
        p.sy = Math.max(-ATM_MAX_PUSH, Math.min(ATM_MAX_PUSH, p.sy + dy / d * k));
      }
    }
  }
  tick() {
    if (!this.enabled) return;
    const { width: W, height: H } = this;
    this.age++;

    // Ease the nebula tint toward the theme hue the short way round.
    const dh = ((this.targetHue - this.hue + 540) % 360) - 180;
    this.hue = (this.hue + dh * 0.01 + 360) % 360;

    for (const s of this.stars) {
      s.y += (0.15 + 1.3 * s.z) * ATM_SCROLL;
      if (s.y > H + 4) { s.y = -4; s.x = Math.random() * W; }
    }
    for (const d of this.dust) {
      d.x += Math.sin(this.age * 0.01 + d.phase) * 0.15 + d.sx;
      d.y += (0.5 + 1.6 * d.z) * ATM_SCROLL + d.sy;
      d.sx *= 0.93;
      d.sy *= 0.93;
      if (d.y > H + 4) { d.y = -4; d.x = Math.random() * W; }
      if (d.y < -60) d.y = -60;
      if (d.x < -20) d.x = W + 20; else if (d.x > W + 20) d.x = -20;
    }
    for (const n of this.nebulae) {
      n.y += n.vy * ATM_SCROLL;
      if (n.y - n.r > H) { n.y = -n.r; n.x = Math.random() * W; }
    }
    for (let i = 0; i < this.debris.length; i++) {
      const d = this.debris[i];
      d.x += d.vx * d.z + d.sx;
      d.y += (0.3 + 1.1 * d.z) * ATM_SCROLL + d.sy;
      d.sx *= 0.94;
      d.sy *= 0.94;
      d.angle += d.spin;
      const r = d.mesh.r * d.scale;
      if (d.y - r > H || d.x < -r - 80 || d.x > W + r + 80) this.debris[i] = this.newDebris(false);
    }
  }
  draw(ctx) {
    if (!this.enabled) return;
    ctx.save();

    // Nebula glow
    for (const n of this.nebulae) {
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      const h = (this.hue + n.hueOffset + 360) % 360;
      g.addColorStop(0, `hsla(${h}, 50%, 35%, 0.16)`);
      g.addColorStop(1, `hsla(${h}, 50%, 35%, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
    }

    // Stars: nearer ones are bigger, brighter, and streak a little.
    for (const s of this.stars) {
      const twinkle = 0.75 + 0.25 * Math.sin(this.age * 0.05 + s.phase);
      ctx.globalAlpha = (0.15 + 0.5 * s.z) * twinkle;
      ctx.fillStyle = '#cdf';
      const size = 0.7 + 1.1 * s.z;
      ctx.fillRect(s.x, s.y, size, size * (1 + 2.5 * s.z));
    }

    // Dust motes
    ctx.fillStyle = '#9ab';
    for (const d of this.dust) {
      ctx.globalAlpha = 0.1 + 0.25 * d.z;
      const size = 1 + d.z;
      ctx.fillRect(d.x, d.y, size, size);
    }

    // Debris meshes
    for (const d of this.debris) this.drawDebris(ctx, d);

    ctx.restore();
  }
  drawDebris(ctx, d) {
    const m = d.mesh;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.angle);
    ctx.scale(d.scale, d.scale);
    ctx.globalAlpha = 0.3 + 0.5 * d.z;
    ctx.lineWidth = 1 / d.scale;
    for (const poly of m.polys) {
      ctx.fillStyle = `hsl(${m.hue}, ${m.sat}%, ${8 + poly.tone * 22}%)`;
      ctx.strokeStyle = `hsl(${m.hue}, ${m.sat}%, ${18 + poly.tone * 24}%)`;
      ctx.beginPath();
      poly.pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (m.lines) {
      ctx.strokeStyle = `hsl(${m.hue}, ${m.sat}%, 30%)`;
      ctx.beginPath();
      for (const [x1, y1, x2, y2] of m.lines) {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
