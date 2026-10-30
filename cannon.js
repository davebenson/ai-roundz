// A cannon that rolls in from the left or right edge to a spot in the top
// quarter of the screen, then lobs cannonballs toward the far side. The
// barrel angle is fixed; only the muzzle speed varies, so the balls land
// anywhere between the cannon's own x and the opposite edge of the screen.
const CANNON_ELEVATION = 50 * Math.PI / 180;   // barrel angle above horizontal
const CANNON_BARREL = 30;
const CANNON_HP = 8;
const CANNON_MARGIN = 60;                      // resting distance from the edge

// Cannonballs fly at half the speed they otherwise would. Scaling gravity by
// the square of the speed scale keeps the trajectories the same shape (and the
// landing spread the same), just slower.
const CANNONBALL_SPEED_SCALE = 0.5;
const CANNONBALL_GRAVITY = SHELL_GRAVITY * CANNONBALL_SPEED_SCALE ** 2;

class Cannon extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y, fireChance, speed);
    this.color = '#99a';
    this.w = 52;
    this.h = 36;
    this.side = x < 0 ? -1 : 1;      // -1: rolled in from the left
    this.restX = this.side < 0 ? CANNON_MARGIN : null;   // right side set on first move
    this.state = 'arrive';           // arrive | ready
    this.hp = CANNON_HP;
    this.recoil = 0;
    this.wheel = 0;
  }
  // Index 0 comes from the left, 1 from the right; both stop in the top quarter.
  static spawnPoint(world, index) {
    return {
      x: index % 2 === 0 ? -60 : world.width + 60,
      y: 30 + Math.random() * (world.height / 4 - 50),
    };
  }
  // The barrel points inward and up: +1 means toward the right.
  facing() {
    return -this.side;
  }
  muzzle() {
    const f = this.facing();
    return {
      x: this.x + f * Math.cos(CANNON_ELEVATION) * CANNON_BARREL,
      y: this.y - 8 - Math.sin(CANNON_ELEVATION) * CANNON_BARREL,
    };
  }
  move(world) {
    this.recoil *= 0.85;
    if (this.state === 'arrive') {
      const restX = this.side < 0 ? CANNON_MARGIN : world.width - CANNON_MARGIN;
      const dir = Math.sign(restX - this.x);
      const s = 2 * this.step;
      this.x += dir * s;
      this.wheel += dir * s / 10;
      if (Math.abs(restX - this.x) <= s) {
        this.x = restX;
        this.state = 'ready';
      }
    }
  }
  fire(world) {
    if (this.state !== 'ready') return;
    const m = this.muzzle();
    // Pick where the ball should land (anywhere from here to the far edge)
    // and solve for the muzzle speed that gets it there at the bottom of
    // the screen: dy = -D*tan(e) + g*D^2 / (2*v^2*cos^2(e)).
    const far = this.side < 0 ? world.width - m.x : m.x;
    const D = Math.random() * far;
    const dy = world.height - m.y;
    const e = CANNON_ELEVATION;
    const v = Math.sqrt(CANNONBALL_GRAVITY * D * D / (2 * Math.cos(e) ** 2 * (dy + D * Math.tan(e))));
    const f = this.facing();
    world.add(new Cannonball(m.x, m.y, f * v * Math.cos(e), -v * Math.sin(e)));
    this.recoil = 6;
    sfx.cannon();
  }
  hit(world, px, py) {
    if (--this.hp <= 0) this.kill(world);
    else sfx.clang();
  }
  draw(ctx) {
    const f = this.facing();
    ctx.save();
    ctx.translate(this.x, this.y);

    // Barrel, kicking back along its axis when it fires
    ctx.save();
    ctx.translate(0, -8);
    ctx.rotate(f * (Math.PI / 2 - CANNON_ELEVATION));
    ctx.fillStyle = '#556';
    ctx.fillRect(-6, -CANNON_BARREL + this.recoil, 12, CANNON_BARREL);
    ctx.fillRect(-8, -CANNON_BARREL + this.recoil, 16, 5);
    ctx.restore();

    // Carriage
    const hurt = this.hp / CANNON_HP;
    ctx.fillStyle = hurt > 0.6 ? this.color : hurt > 0.3 ? '#ca7' : '#d65';
    ctx.fillRect(-18, -12, 36, 14);

    // Wheel with spokes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 6, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = this.wheel + k * Math.PI / 4;
      ctx.moveTo(Math.cos(a) * 12, 6 + Math.sin(a) * 12);
      ctx.lineTo(-Math.cos(a) * 12, 6 - Math.sin(a) * 12);
    }
    ctx.stroke();
    ctx.restore();
  }
}
