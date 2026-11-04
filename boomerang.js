// Flies in from the left or right edge along a parabola that peaks just short
// of the far side, then curves back along a different arc and leaves where it
// came in. Spins the whole way. `speed` scales how fast it flies.
const BOOMERANG_TICKS = 260;   // flight time at speed 1
const BOOMERANG_REACH = 0.88;  // how far across the screen it gets (fraction of width)

class Boomerang extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1, index = 0) {
    super(x, y, fireChance, speed);
    this.color = '#fa3';
    this.w = 32;
    this.h = 32;
    this.dir = x < 400 ? 1 : -1;       // +1: flying in from the left
    this.homeX = x;
    this.homeY = y;
    this.dip = 90 + Math.random() * 110;   // how far it descends at the far side
    this.swing = (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 40);
    this.t = -index * 28;              // negative: waiting offscreen
    this.rate = speed / BOOMERANG_TICKS;
    this.angle = 0;
  }
  static spawnPoint(world) {
    const left = Math.random() < 0.5;
    return { x: left ? -30 : world.width + 30, y: 50 + Math.random() * 200 };
  }
  get active() {
    return this.t >= 0;
  }
  contains(px, py) {
    return this.active && Math.hypot(px - this.x, py - this.y) < 18;
  }
  overlapsPlayer(p) {
    return this.active && Math.hypot(p.x - this.x, p.y - this.y) < 22;
  }
  move(world) {
    if (this.t++ === -1) sfx.whoosh();
    if (this.t < 0) return;
    const p = this.t * this.rate;
    if (p >= 1) {
      this.dead = true;          // flew home: gone, no explosion
      return;
    }
    const arc = 4 * p * (1 - p);   // 0 at the edge, 1 at the far turn
    const reach = (world.width + 60) * BOOMERANG_REACH;
    this.x = this.homeX + this.dir * reach * arc;
    // Down on the way out, a sideways loop that flips sign on the way back.
    this.y = this.homeY + this.dip * arc + this.swing * Math.sin(2 * Math.PI * p);
    this.angle += 0.3;
  }
  onDeath(world) {
    explode(world, this.x, this.y, this.color);
    sfx.explosion();
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle * this.dir);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-15, -8);
    ctx.lineTo(0, 6);
    ctx.lineTo(15, -8);
    ctx.stroke();
    ctx.restore();
  }
}
