// A long pipe that spins as it bounces around the screen. Big bullets shoot
// out of either end, at random, until that end is shot off. The body is
// invulnerable until both ends are gone; then it takes a few more hits.
const PIPE_LENGTH = 170;
const PIPE_RADIUS = 13;      // half the width of the bore (the opening)
const PIPE_FLANGE = 17;      // half the width at the ends
const PIPE_END_ZONE = 30;    // how far from the tip counts as "the end"
const PIPE_END_HP = 3;
const PIPE_BODY_HP = 5;

class Pipe extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y, fireChance, speed);
    this.color = '#aab';
    this.angle = Math.random() * Math.PI * 2;
    this.spin = (Math.random() < 0.5 ? -1 : 1) * 0.012;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.vdir = Math.random() < 0.5 ? -1 : 1;
    this.endHp = [PIPE_END_HP, PIPE_END_HP];   // [+u end, -u end]
    this.hp = PIPE_BODY_HP;
  }
  static spawnPoint(world) {
    const r = PIPE_LENGTH / 2;
    return {
      x: r + Math.random() * (world.width - 2 * r),
      y: r + Math.random() * (world.height / 2 - r),
    };
  }
  // Position of the tip of end `i` (0 = +u end, 1 = -u end) and its direction.
  endTip(i) {
    const s = i === 0 ? 1 : -1;
    const dx = Math.cos(this.angle) * s;
    const dy = Math.sin(this.angle) * s;
    return { x: this.x + dx * PIPE_LENGTH / 2, y: this.y + dy * PIPE_LENGTH / 2, dx, dy };
  }
  // Convert a world point to pipe coordinates: u along the pipe, v across.
  local(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const c = Math.cos(this.angle);
    const s = Math.sin(this.angle);
    return { u: dx * c + dy * s, v: -dx * s + dy * c };
  }
  move(world) {
    const r = PIPE_LENGTH / 2;   // keeps the whole pipe on screen at any angle
    this.angle += this.spin;
    this.x += this.dir * this.step;
    this.y += this.vdir * this.step * 0.7;
    if (this.x < r) { this.x = r; this.dir = 1; }
    else if (this.x > world.width - r) { this.x = world.width - r; this.dir = -1; }
    if (this.y < r) { this.y = r; this.vdir = 1; }
    else if (this.y > world.height - r) { this.y = world.height - r; this.vdir = -1; }
  }
  fire(world) {
    const alive = [0, 1].filter(i => this.endHp[i] > 0);
    if (alive.length === 0) return;
    const tip = this.endTip(alive[Math.floor(Math.random() * alive.length)]);
    const speed = 3;
    world.add(new BigBullet(tip.x + tip.dx * 12, tip.y + tip.dy * 12, tip.dx * speed, tip.dy * speed));
    sfx.bigShot();
  }
  contains(px, py) {
    const { u, v } = this.local(px, py);
    return Math.abs(u) <= PIPE_LENGTH / 2 && Math.abs(v) <= PIPE_FLANGE;
  }
  overlapsPlayer(p) {
    const { u, v } = this.local(p.x, p.y);
    return Math.abs(u) < PIPE_LENGTH / 2 + 8 && Math.abs(v) < PIPE_FLANGE + 12;
  }
  hit(world, px, py) {
    const { u } = this.local(px, py);
    const i = u >= 0 ? 0 : 1;
    sfx.clang();
    if (this.endHp[0] > 0 || this.endHp[1] > 0) {
      // Only the ends are vulnerable at first.
      if (Math.abs(u) > PIPE_LENGTH / 2 - PIPE_END_ZONE && this.endHp[i] > 0) {
        if (--this.endHp[i] === 0) {
          const tip = this.endTip(i);
          explode(world, tip.x, tip.y, this.color, 4);
          sfx.explosion();
        }
      }
    } else if (--this.hp <= 0) {
      this.kill(world);
    }
  }
  onDeath(world) {
    explode(world, this.x, this.y, this.color, 5);
    explode(world, this.x, this.y, '#fff', 2);
    sfx.bigExplosion();
  }
  // Fraction of health left, as a color from steel to red.
  tint(fraction) {
    const g = Math.round(170 * fraction + 40 * (1 - fraction));
    return `rgb(${Math.round(170 + 60 * (1 - fraction))}, ${g}, ${g + 17 * fraction})`;
  }
  draw(ctx) {
    const half = PIPE_LENGTH / 2;
    const bodyColor = this.endHp[0] > 0 || this.endHp[1] > 0
      ? this.color
      : this.tint(this.hp / PIPE_BODY_HP);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Body, shortened a bit at any broken end.
    const cutA = this.endHp[0] > 0 ? 0 : 12;
    const cutB = this.endHp[1] > 0 ? 0 : 12;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-half + cutB, -PIPE_RADIUS, PIPE_LENGTH - cutA - cutB, PIPE_RADIUS * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(-half + cutB, -PIPE_RADIUS + 3, PIPE_LENGTH - cutA - cutB, 4);

    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? 1 : -1;
      if (this.endHp[i] > 0) {
        // Flange and the dark opening at the tip.
        ctx.fillStyle = this.tint(this.endHp[i] / PIPE_END_HP);
        ctx.fillRect(s > 0 ? half - 14 : -half, -PIPE_FLANGE, 14, PIPE_FLANGE * 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(s > 0 ? half - 5 : -half, -PIPE_RADIUS + 1, 5, PIPE_RADIUS * 2 - 2);
      } else {
        // Jagged broken end.
        ctx.fillStyle = '#554';
        ctx.beginPath();
        ctx.moveTo(s * (half - 12), -PIPE_RADIUS);
        ctx.lineTo(s * (half - 4), -8);
        ctx.lineTo(s * (half - 10), -3);
        ctx.lineTo(s * (half - 2), 3);
        ctx.lineTo(s * (half - 9), 8);
        ctx.lineTo(s * (half - 5), PIPE_RADIUS);
        ctx.lineTo(s * (half - 12), PIPE_RADIUS);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
