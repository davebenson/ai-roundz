// A wedge-shaped ship that hunts the player. Each tick it turns toward the
// player (limited turn rate) and thrusts along its heading with a force
// proportional to 1/distance^2. Speed is capped and slightly damped, and
// it reflects off the screen edges, heading included.
const CHASER_TURN = 0.05;        // max radians turned per tick
const CHASER_THRUST = 4500;      // thrust = CHASER_THRUST / distance^2 ...
const CHASER_MAX_THRUST = 0.3;   // ... capped, so close range isn't explosive
const CHASER_DAMPING = 0.99;
const CHASER_MAX_SPEED = 3;      // scaled by the wave's speed

class Chaser extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y, fireChance, speed);
    this.color = '#f55';
    this.w = 26;
    this.h = 26;
    this.maxSpeed = CHASER_MAX_SPEED * speed;
    this.angle = Math.PI / 2;    // heading; starts pointing down
    this.vx = 0;
    this.vy = 0;
    this.thrust = 0;
  }
  static spawnPoint(world) {
    return {
      x: 40 + Math.random() * (world.width - 80),
      y: 40 + Math.random() * (world.height / 3 - 40),
    };
  }
  move(world) {
    const p = world.player;
    if (!p.dead) {
      const dx = p.x - this.x;
      const dy = p.y - this.y;

      // Turn toward the player by the shortest way round.
      let diff = Math.atan2(dy, dx) - this.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));   // wrap to [-pi, pi]
      this.angle += Math.max(-CHASER_TURN, Math.min(CHASER_TURN, diff));

      const d2 = Math.max(dx * dx + dy * dy, 400);
      this.thrust = Math.min(CHASER_THRUST / d2, CHASER_MAX_THRUST);
      this.vx += Math.cos(this.angle) * this.thrust;
      this.vy += Math.sin(this.angle) * this.thrust;
    }

    this.vx *= CHASER_DAMPING;
    this.vy *= CHASER_DAMPING;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed) {
      this.vx *= this.maxSpeed / speed;
      this.vy *= this.maxSpeed / speed;
    }
    this.x += this.vx;
    this.y += this.vy;

    // Reflect off the walls: velocity and heading both mirror.
    const r = 14;
    if (this.x < r) {
      this.x = r;
      this.vx = Math.abs(this.vx);
      this.angle = Math.PI - this.angle;
    } else if (this.x > world.width - r) {
      this.x = world.width - r;
      this.vx = -Math.abs(this.vx);
      this.angle = Math.PI - this.angle;
    }
    if (this.y < r) {
      this.y = r;
      this.vy = Math.abs(this.vy);
      this.angle = -this.angle;
    } else if (this.y > world.height - r) {
      this.y = world.height - r;
      this.vy = -Math.abs(this.vy);
      this.angle = -this.angle;
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Engine flame, longer with more thrust.
    const flame = 4 + 14 * this.thrust / CHASER_MAX_THRUST;
    ctx.fillStyle = '#fa0';
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(-10 - flame, 0);
    ctx.lineTo(-10, 4);
    ctx.closePath();
    ctx.fill();

    // Wedge hull, nose along +x.
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
