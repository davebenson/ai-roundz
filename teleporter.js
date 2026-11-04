// Fades out, reappears somewhere else at random, and fires a bullet straight
// down from each new spot. The hop period shrinks the longer it lives. It can
// only be shot or touched while mostly solid.
const TELEPORT_FADE = 18;          // ticks to fade in or out
const TELEPORT_START_PERIOD = 150; // ticks between hops at first...
const TELEPORT_END_PERIOD = 50;    // ...shrinking to this
const TELEPORT_RAMP = 1800;        // ticks over which it speeds up
const TELEPORT_SOLID = 0.6;        // alpha above which it is vulnerable

class Teleporter extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1, index = 0) {
    super(x, y, fireChance, speed);
    this.color = '#4df';
    this.w = 30;
    this.h = 30;
    this.age = 0;
    this.phase = 'in';       // in | solid | out
    this.t = -index * 8;     // negative: a staggered, invisible start
    this.alpha = 0;
    this.speed = speed;
  }
  static spawnPoint(world) {
    return Teleporter.randomSpot(world);
  }
  static randomSpot(world) {
    return {
      x: 40 + Math.random() * (world.width - 80),
      y: 40 + Math.random() * (world.height * 0.6 - 40),
    };
  }
  period() {
    const k = Math.min(1, this.age / TELEPORT_RAMP);
    return (TELEPORT_START_PERIOD + (TELEPORT_END_PERIOD - TELEPORT_START_PERIOD) * k) / this.speed;
  }
  tick(world) {
    this.age++;
    super.tick(world);
  }
  move(world) {
    if (++this.t < 0) return;
    if (this.phase === 'in') {
      this.alpha = Math.min(1, this.t / TELEPORT_FADE);
      if (this.t >= TELEPORT_FADE) {
        this.phase = 'solid';
        this.t = 0;
        this.shoot(world);
      }
    } else if (this.phase === 'solid') {
      this.alpha = 1;
      if (this.t >= Math.max(0, this.period() - 2 * TELEPORT_FADE)) {
        this.phase = 'out';
        this.t = 0;
        sfx.blink(false);
      }
    } else {
      this.alpha = Math.max(0, 1 - this.t / TELEPORT_FADE);
      if (this.t >= TELEPORT_FADE) {
        const { x, y } = Teleporter.randomSpot(world);
        this.x = x;
        this.y = y;
        this.phase = 'in';
        this.t = 0;
        sfx.blink(true);
      }
    }
  }
  shoot(world) {
    world.add(new OrbBullet(this.x, this.y, 0, 2));
    sfx.enemyShot();
  }
  get solid() {
    return this.alpha >= TELEPORT_SOLID;
  }
  contains(px, py) {
    return this.solid && Math.hypot(px - this.x, py - this.y) < 16;
  }
  overlapsPlayer(p) {
    return this.solid && Math.hypot(p.x - this.x, p.y - this.y) < 24;
  }
  draw(ctx) {
    if (this.alpha <= 0) return;
    const { x, y } = this;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(-11, -11, 22, 22);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
