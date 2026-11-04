// A small flapping arch that flocks: it steers toward its neighbours' centre
// (cohesion), away from ones that are too close (separation), toward their
// heading (alignment), and gently toward the player, so the swarm curls
// around the ship. Harmless to shoot, deadly to touch.
const BOID_SIGHT = 80;     // neighbours within this distance count
const BOID_CROWD = 22;     // closer than this and they push apart
const BOID_MARGIN = 50;    // turn away from walls inside this distance

class Boid extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y, fireChance, speed);
    this.color = `hsl(${170 + Math.random() * 60}, 85%, 65%)`;
    this.w = 14;
    this.h = 14;
    this.maxSpeed = 2.6 * speed;
    const a = Math.random() * Math.PI * 2;
    this.vx = Math.cos(a) * this.maxSpeed;
    this.vy = Math.sin(a) * this.maxSpeed;
    this.flap = Math.random() * Math.PI * 2;
  }
  static spawnPoint(world) {
    return { x: 40 + Math.random() * (world.width - 80), y: 30 + Math.random() * 120 };
  }
  contains(px, py) {
    return Math.hypot(px - this.x, py - this.y) < 10;
  }
  overlapsPlayer(p) {
    return Math.hypot(p.x - this.x, p.y - this.y) < 16;
  }
  move(world) {
    let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
    for (const o of world.enemies) {
      if (o === this || !(o instanceof Boid)) continue;
      const dx = o.x - this.x, dy = o.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > BOID_SIGHT) continue;
      n++;
      cx += dx; cy += dy;
      ax += o.vx; ay += o.vy;
      if (d < BOID_CROWD && d > 0) {
        sx -= dx / d * (BOID_CROWD - d);
        sy -= dy / d * (BOID_CROWD - d);
      }
    }
    let fx = sx * 0.08, fy = sy * 0.08;
    if (n > 0) {
      fx += cx / n * 0.004 + (ax / n - this.vx) * 0.05;
      fy += cy / n * 0.004 + (ay / n - this.vy) * 0.05;
    }
    // Drift toward the player, but wander a little so it isn't a straight dive.
    const p = world.player;
    if (!p.dead) {
      const dx = p.x - this.x, dy = p.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      fx += dx / d * 0.03;
      fy += dy / d * 0.03;
    }
    fx += (Math.random() - 0.5) * 0.06;
    fy += (Math.random() - 0.5) * 0.06;
    // Steer back from the walls.
    if (this.x < BOID_MARGIN) fx += 0.12;
    else if (this.x > world.width - BOID_MARGIN) fx -= 0.12;
    if (this.y < BOID_MARGIN) fy += 0.12;
    else if (this.y > world.height - BOID_MARGIN) fy -= 0.12;

    this.vx += fx;
    this.vy += fy;
    const s = Math.hypot(this.vx, this.vy);
    if (s > this.maxSpeed) {
      this.vx *= this.maxSpeed / s;
      this.vy *= this.maxSpeed / s;
    } else if (s < this.maxSpeed * 0.5 && s > 0) {
      this.vx *= this.maxSpeed * 0.5 / s;
      this.vy *= this.maxSpeed * 0.5 / s;
    }
    this.x += this.vx;
    this.y += this.vy;
    this.x = Math.max(4, Math.min(world.width - 4, this.x));
    this.y = Math.max(4, Math.min(world.height - 4, this.y));
    this.flap += 0.35;
  }
  onDeath(world) {
    explode(world, this.x, this.y, this.color, 2);
    sfx.pop();
  }
  // An arch whose wingtips beat up and down, pointing along its heading.
  draw(ctx) {
    const lift = Math.sin(this.flap) * 5;   // wingtip height, +/- 
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, 3 - lift);
    ctx.quadraticCurveTo(0, -6 + lift * 0.6, 8, 3 - lift);
    ctx.stroke();
    ctx.restore();
  }
}
