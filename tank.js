// A tank that rolls back and forth along a horizontal line, swinging its
// turret toward the player and lobbing shells in parabolic arcs.
const SHELL_GRAVITY = 0.12;      // pixels/tick^2, downward
const SHELL_SPEED = 9;
const TANK_TURRET_TURN = 0.03;   // max radians per tick
const TANK_HP = 3;

class Tank extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y, fireChance, speed);
    this.color = '#8a5';
    this.w = 48;
    this.h = 28;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.hp = TANK_HP;
    this.turret = 0;     // radians from straight up; positive leans right
    this.spread = 0.1;   // random aiming error, in radians
  }
  // Tanks patrol the horizontal line through the middle of the screen.
  static spawnPoint(world) {
    return { x: 40 + Math.random() * (world.width - 80), y: world.height / 2 };
  }
  move(world) {
    this.x += this.dir * this.step;
    if (this.x < this.w / 2) { this.x = this.w / 2; this.dir = 1; }
    else if (this.x > world.width - this.w / 2) { this.x = world.width - this.w / 2; this.dir = -1; }

    const target = this.aimAngle(world.player);
    if (target !== null) {
      const diff = target - this.turret;
      this.turret += Math.max(-TANK_TURRET_TURN, Math.min(TANK_TURRET_TURN, diff));
    }
  }
  pivotY() {
    return this.y - 8;
  }
  // Turret angle (from vertical) that would lob a shell onto the player,
  // using the high arc. If the player is out of range, aim for max range.
  aimAngle(p) {
    if (p.dead) return null;
    const side = p.x >= this.x ? 1 : -1;
    const X = Math.abs(p.x - this.x);
    const h = p.y - this.pivotY();      // positive when the player is lower
    let elevation = Math.PI / 4;
    if (X < 5) {
      elevation = Math.PI / 2;
    } else {
      // Solve h = -X*T + g*X^2*(1 + T^2) / (2*v^2) for T = tan(elevation).
      const a = SHELL_GRAVITY * X * X / (2 * SHELL_SPEED * SHELL_SPEED);
      const disc = X * X - 4 * a * (a - h);
      if (disc >= 0) elevation = Math.atan((X + Math.sqrt(disc)) / (2 * a));
    }
    return side * (Math.PI / 2 - elevation);
  }
  fire(world) {
    const theta = this.turret + (Math.random() * 2 - 1) * this.spread;
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);
    const barrel = 26;
    world.add(new Shell(this.x + sin * barrel, this.pivotY() - cos * barrel,
      sin * SHELL_SPEED, -cos * SHELL_SPEED));
    sfx.shell();
  }
  hit(world, px, py) {
    if (--this.hp <= 0) this.kill(world);
    else sfx.clang();
  }
  draw(ctx) {
    const hurt = this.hp / TANK_HP;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Treads and wheels
    ctx.fillStyle = '#333';
    ctx.fillRect(-24, 3, 48, 11);
    ctx.fillStyle = '#777';
    for (let wx = -17; wx <= 17; wx += 11.5) {
      ctx.beginPath();
      ctx.arc(wx, 8.5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Hull, redder as it takes damage
    ctx.fillStyle = hurt > 0.6 ? this.color : hurt > 0.3 ? '#ca5' : '#d54';
    ctx.fillRect(-20, -6, 40, 10);
    // Turret dome and barrel
    ctx.beginPath();
    ctx.arc(0, -6, 9, Math.PI, 0);
    ctx.fill();
    ctx.translate(0, -8);
    ctx.rotate(this.turret);
    ctx.fillRect(-3, -26, 6, 26);
    ctx.restore();
  }
}
