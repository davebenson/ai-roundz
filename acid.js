// A drop of acid that gathers at the top of the screen. It swells until it is
// full, then lets go and falls, accelerating under gravity. It splashes (and
// vanishes) when it reaches the bottom.
const ACID_MIN_RADIUS = 2;
const ACID_MAX_RADIUS = 14;
const ACID_GRAVITY = 0.2;     // pixels/tick^2
const ACID_NECK = 6;          // gap between the ceiling and a hanging drop

class Acid extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y, fireChance, speed);
    this.color = '#9f2';
    this.radius = ACID_MIN_RADIUS;
    this.w = this.h = this.radius * 2;
    this.fillTime = 120 + Math.random() * 180;   // ticks until full
    this.age = 0;
    this.state = 'forming';     // forming | falling
    this.vy = 0;
    this.y = ACID_NECK + this.radius;
  }
  // A spot along the ceiling, clear of other hanging drops if possible.
  static spawnPoint(world) {
    let x;
    for (let tries = 0; tries < 30; tries++) {
      x = 30 + Math.random() * (world.width - 60);
      if (world.objects.every(o => !(o instanceof Acid) || o.state !== 'forming' || Math.abs(o.x - x) > 34)) break;
    }
    return { x, y: ACID_NECK + ACID_MIN_RADIUS };
  }
  move(world) {
    if (this.state === 'forming') {
      this.age++;
      const t = Math.min(1, this.age / this.fillTime);
      this.radius = ACID_MIN_RADIUS + (ACID_MAX_RADIUS - ACID_MIN_RADIUS) * t;
      this.y = ACID_NECK + this.radius;
      if (t >= 1) {
        this.state = 'falling';
        sfx.drip();
      }
    } else {
      this.vy += ACID_GRAVITY * this.step;
      this.y += this.vy;
      if (this.y > world.height - this.radius) this.splash(world);
    }
  }
  splash(world) {
    this.dead = true;
    explode(world, this.x, world.height - 4, this.color, 2);
  }
  contains(px, py) {
    return Math.hypot(px - this.x, py - this.y) < Math.max(this.radius, 6);
  }
  overlapsPlayer(p) {
    return Math.hypot(p.x - this.x, p.y - this.y) < this.radius + 10;
  }
  onDeath(world) {
    explode(world, this.x, this.y, this.color);
    sfx.pop();
  }
  draw(ctx) {
    const { x, y, radius: r } = this;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    if (this.state === 'forming') {
      // A bulge on the ceiling that sags as it fills, wobbling when nearly full.
      const t = this.age / this.fillTime;
      const wobble = t > 0.85 ? Math.sin(this.age * 1.2) * 1.5 : 0;
      ctx.moveTo(x - 3, 0);
      ctx.lineTo(x + 3, 0);
      ctx.lineTo(x + r * 0.8 + wobble, y - r * 0.3);
      ctx.lineTo(x - r * 0.8 + wobble, y - r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + wobble, y, r, 0, Math.PI * 2);
    } else {
      // Teardrop with the tail trailing above, longer the faster it falls.
      const tail = r * (1.2 + this.vy / 6);
      ctx.moveTo(x, y - r - tail);
      ctx.lineTo(x - r * 0.95, y - r * 0.3);
      ctx.lineTo(x + r * 0.95, y - r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}
