// A randomly colored ball that bounces off the screen edges and off other
// balls (an elastic collision between equal masses). Each ball-ball collision
// lays a Bomb at the point of impact.
const BALL_RADIUS = 20;
const BALL_SPEED = 2;      // scaled by the wave's speed

// Each ball sings one note of an A minor 7th chord (A C E G) spread over
// three octaves: 12 notes, one per ball in a full wave.
const BALL_NOTES = [-12, 0, 12].flatMap(octave =>
  [0, 3, 7, 10].map(semitones => 220 * 2 ** ((octave + semitones) / 12)));

class Ball extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1, index = 0) {
    super(x, y, fireChance, speed);
    this.pitch = BALL_NOTES[index % BALL_NOTES.length];
    this.color = `hsl(${Math.floor(Math.random() * 360)}, 80%, 55%)`;
    this.radius = BALL_RADIUS;
    this.w = this.h = this.radius * 2;
    const a = Math.random() * Math.PI * 2;
    this.vx = Math.cos(a) * BALL_SPEED * speed;
    this.vy = Math.sin(a) * BALL_SPEED * speed;
  }
  // Random spot in the upper part of the screen, clear of existing balls.
  static spawnPoint(world) {
    let p;
    for (let tries = 0; tries < 50; tries++) {
      p = {
        x: BALL_RADIUS + Math.random() * (world.width - 2 * BALL_RADIUS),
        y: BALL_RADIUS + Math.random() * (world.height * 0.6 - BALL_RADIUS),
      };
      const clear = world.objects.every(o =>
        !(o instanceof Ball) || Math.hypot(o.x - p.x, o.y - p.y) > BALL_RADIUS * 2 + 4);
      if (clear) break;
    }
    return p;
  }
  move(world) {
    const r = this.radius;
    this.x += this.vx;
    this.y += this.vy;
    let bounced = false;
    if (this.x < r) { this.x = r; this.vx = Math.abs(this.vx); bounced = true; }
    else if (this.x > world.width - r) { this.x = world.width - r; this.vx = -Math.abs(this.vx); bounced = true; }
    if (this.y < r) { this.y = r; this.vy = Math.abs(this.vy); bounced = true; }
    else if (this.y > world.height - r) { this.y = world.height - r; this.vy = -Math.abs(this.vy); bounced = true; }
    if (bounced) sfx.note(this.pitch);

    for (const o of world.objects) {
      if (o !== this && o instanceof Ball && !o.dead) this.collide(world, o);
    }
  }
  collide(world, o) {
    const dx = this.x - o.x;
    const dy = this.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d >= this.radius + o.radius || d === 0) return;

    // Relative speed along the line of centers; skip if already separating
    // (this also keeps the pair from being handled twice, once per ball).
    const nx = dx / d;
    const ny = dy / d;
    const vn = (this.vx - o.vx) * nx + (this.vy - o.vy) * ny;
    if (vn >= 0) return;

    // Equal masses: swap the normal components of velocity.
    this.vx -= vn * nx;
    this.vy -= vn * ny;
    o.vx += vn * nx;
    o.vy += vn * ny;

    // Push the balls apart so they don't overlap.
    const push = (this.radius + o.radius - d) / 2;
    this.x += nx * push;
    this.y += ny * push;
    o.x -= nx * push;
    o.y -= ny * push;

    world.add(new Bomb((this.x + o.x) / 2, (this.y + o.y) / 2, this.color, o.color, this.radius));
    sfx.bump();
  }
  contains(px, py) {
    return Math.hypot(px - this.x, py - this.y) < this.radius;
  }
  overlapsPlayer(p) {
    return Math.hypot(p.x - this.x, p.y - this.y) < this.radius + 10;
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}
