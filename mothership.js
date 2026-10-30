// A large ship that flies in from one upper corner to a random spot, releases
// a batch of enemies, then flies off to the opposite upper corner and
// vanishes. It is armored (shots just ping off it) and harmless to touch.
const MOTHERSHIP_SPEED = 2.5;
const MOTHERSHIP_PAYLOAD = 8;           // default load: this many Jagged
const MOTHERSHIP_RELEASE_TICKS = 14;   // between releases

class Mothership extends Enemy {
  // options.drops: what to release, in order, as [{ type, count, fireChance,
  // speed }]. Defaults to a load of Jagged.
  constructor(x, y, fireChance = 0, speed = 1, index = 0, options = {}) {
    super(x, y, fireChance, speed);
    const drops = options.drops || [{ type: Jagged, count: MOTHERSHIP_PAYLOAD }];
    this.queue = drops.flatMap(d => Array(d.count).fill(d));
    this.color = '#778';
    this.w = 170;
    this.h = 50;
    this.side = x < 0 ? -1 : 1;    // -1: arrived from the left corner
    this.target = null;            // random hover point, chosen on arrival
    this.state = 'arrive';         // arrive | release | depart
    this.timer = 0;
    this.released = 0;
    this.age = 0;
  }
  // Just off-screen at a random upper corner.
  static spawnPoint(world) {
    return { x: Math.random() < 0.5 ? -100 : world.width + 100, y: 45 };
  }
  moveToward(tx, ty) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    const s = MOTHERSHIP_SPEED * this.step;
    if (d <= s) {
      this.x = tx;
      this.y = ty;
      return true;
    }
    this.x += dx / d * s;
    this.y += dy / d * s;
    return false;
  }
  move(world) {
    this.age++;
    if (this.state === 'arrive') {
      if (!this.target) {
        this.target = { x: 160 + Math.random() * (world.width - 320), y: 60 + Math.random() * 140 };
      }
      if (this.moveToward(this.target.x, this.target.y)) this.state = 'release';
    } else if (this.state === 'release') {
      if (this.released < this.queue.length) {
        if (this.timer-- <= 0) {
          this.timer = MOTHERSHIP_RELEASE_TICKS;
          // Spread the load along the bay, in queue order.
          const k = this.released++;
          const d = this.queue[k];
          const x = this.x + ((k + 0.5) / this.queue.length - 0.5) * 140;
          world.addEnemy(new d.type(x, this.y + 30, d.fireChance ?? 0, d.speed ?? 1, k));
        }
      } else if (this.timer-- <= -30) {
        this.state = 'depart';
      }
    } else {
      // Off to the opposite upper corner, then disappear without a bang.
      const exitX = this.side < 0 ? world.width + 100 : -100;
      if (this.moveToward(exitX, 45)) this.dead = true;
    }
  }
  hit(world, px, py) {
    sfx.clang();
  }
  overlapsPlayer(p) {
    return false;
  }
  draw(ctx) {
    const { x, y } = this;
    const open = this.state === 'release';

    // Hull
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(x, y, 85, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Glass dome
    ctx.fillStyle = 'rgba(140, 200, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y - 6, 22, Math.PI, 0);
    ctx.fill();
    // Underside bay, glowing while it releases
    ctx.fillStyle = open ? '#fd5' : '#222';
    ctx.fillRect(x - 30, y + 12, 60, 8);
    // Rim lights chasing around the edge
    for (let i = -3; i <= 3; i++) {
      const on = (Math.floor(this.age / 8) + i) % 2 === 0;
      ctx.fillStyle = on ? '#fa0' : '#531';
      ctx.beginPath();
      ctx.arc(x + i * 22, y + 4 - Math.abs(i) * 1.5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
