// Firework round: cannons on the left and right lob a rocket that climbs to
// a random point and bursts into a torrent of bullets. The burst emits one
// bullet per tick, all at the same speed, each turned a fixed angle from the
// one before; that angle is picked per firework, so the pattern is a spiral
// for small deltas and a fan of streams for large ones.
const ROCKET_GRAVITY = 0.06;
const FIREWORK_BULLETS = 90;
const FIREWORK_SPEED = 2.8;
const FIREWORK_COOLDOWN = 170;   // ticks before a cannon may launch again

// The burst point. Invisible; it just feeds bullets out until it runs dry.
class Firework extends EnemyBullet {
  constructor(x, y, delta, color) {
    super(x, y, 0, 0);
    this.delta = delta;                       // radians between consecutive bullets
    this.angle = Math.random() * Math.PI * 2;
    this.left = FIREWORK_BULLETS;
    this.color = color;
  }
  tick(world) {
    const bullet = new OrbBullet(this.x, this.y,
      Math.cos(this.angle) * FIREWORK_SPEED, Math.sin(this.angle) * FIREWORK_SPEED);
    bullet.color = this.color;
    world.add(bullet);
    this.angle += this.delta;
    if (--this.left <= 0) this.dead = true;
  }
  draw() {}
}

// A rocket on a parabola that bursts when its fuse runs out.
class Rocket extends EnemyBullet {
  constructor(x, y, vx, vy, fuse) {
    super(x, y, vx, vy);
    this.fuse = fuse;                // ticks until it bursts
    this.radius = 2;
    this.color = `hsl(${Math.random() * 360}, 90%, 65%)`;
    this.trail = [];
  }
  tick(world) {
    this.trail.push(this.x, this.y);
    if (this.trail.length > 16) this.trail.splice(0, 2);
    this.vy += ROCKET_GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    if (--this.fuse <= 0) {
      this.burst(world);
      return;
    }
    if (this.x < -10 || this.x > world.width + 10) this.dead = true;
    else this.hitPlayer(world);
  }
  burst(world) {
    this.dead = true;
    // Spacing is -180..-5 or 5..180 degrees.
    const deg = (5 + Math.random() * 175) * (Math.random() < 0.5 ? -1 : 1);
    world.add(new Firework(this.x, this.y, deg * Math.PI / 180, this.color));
    explode(world, this.x, this.y, this.color, 3);
    sfx.explosion();
  }
  draw(ctx) {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i += 2) {
      if (i === 0) ctx.moveTo(this.trail[i], this.trail[i + 1]);
      else ctx.lineTo(this.trail[i], this.trail[i + 1]);
    }
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A Cannon whose shot is a rocket aimed to peak at a random point in the sky.
class FireworkCannon extends Cannon {
  constructor(...args) {
    super(...args);
    this.cooldown = 60;
  }
  move(world) {
    super.move(world);
    if (this.cooldown > 0) this.cooldown--;
  }
  fire(world) {
    if (this.state !== 'ready' || this.cooldown > 0) return;
    this.cooldown = FIREWORK_COOLDOWN;
    const m = this.muzzle();
    const tx = 140 + Math.random() * (world.width - 280);
    const ty = m.y + 100 + Math.random() * 180;
    // Launch upward, then solve ty = m.y + vy t + g t^2 / 2 for the (falling)
    // crossing time t, and pick vx so the rocket is at tx then.
    const vy = -3 - Math.random() * 2;
    const t = (-vy + Math.sqrt(vy * vy + 2 * ROCKET_GRAVITY * (ty - m.y))) / ROCKET_GRAVITY;
    world.add(new Rocket(m.x, m.y, (tx - m.x) / t, vy, Math.round(t)));
    this.recoil = 6;
    sfx.cannon();
  }
}
