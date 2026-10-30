// A jagged circle released by a Mothership. Its outline is 36 points, 10
// degrees apart, each at a random radius that is re-rolled every draw so the
// edge shimmers. Each tick it either wanders (75%) or steps toward the
// player (25%).
const JAGGED_RADIUS = 16;
const JAGGED_STEP = 4;
const JAGGED_CHASE = 0.25;   // fraction of ticks spent stepping toward the player

class Jagged extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y, fireChance, speed);
    this.radius = JAGGED_RADIUS;
    this.w = this.h = this.radius * 2;
    this.stepSize = JAGGED_STEP * speed;
    this.color = `hsl(${Math.floor(Math.random() * 360)}, 85%, 60%)`;
  }
  move(world) {
    let dx;
    let dy;
    const p = world.player;
    if (!p.dead && Math.random() < JAGGED_CHASE) {
      const d = Math.hypot(p.x - this.x, p.y - this.y) || 1;
      dx = (p.x - this.x) / d;
      dy = (p.y - this.y) / d;
    } else {
      const a = Math.random() * Math.PI * 2;
      dx = Math.cos(a);
      dy = Math.sin(a);
    }
    const r = this.radius;
    this.x = Math.max(r, Math.min(world.width - r, this.x + dx * this.stepSize));
    this.y = Math.max(r, Math.min(world.height - r, this.y + dy * this.stepSize));
  }
  contains(px, py) {
    return Math.hypot(px - this.x, py - this.y) < this.radius;
  }
  overlapsPlayer(p) {
    return Math.hypot(p.x - this.x, p.y - this.y) < this.radius + 10;
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    for (let k = 0; k < 36; k++) {
      const angle = k * 10 * Math.PI / 180;
      const r = this.radius * (0.45 + 0.55 * Math.random());
      const x = this.x + Math.cos(angle) * r;
      const y = this.y + Math.sin(angle) * r;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}
