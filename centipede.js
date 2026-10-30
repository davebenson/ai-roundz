// A centipede is a chain of segments (Centipede enemies) that follows its
// head. Only the head steers: it wanders in weaving curves that bend weakly
// toward the player, and bounces off the walls. Every other segment is placed
// on the path the head has already walked, a fixed distance behind the one
// before it. Shooting a segment removes it; whatever was behind it becomes a
// new chain with its own head.
const CENTIPEDE_SPACING = 24;      // distance along the path between segment centers
const CENTIPEDE_RADIUS = 12;
const CENTIPEDE_HEAD_RADIUS = 15;
const CENTIPEDE_BASE_SPEED = 2;    // px/tick for a chain of CENTIPEDE_REF_LENGTH
const CENTIPEDE_REF_LENGTH = 16;   // shorter chains run faster, longer ones slower

function wrapAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

class Chain {
  constructor(speedMul = 1) {
    this.segments = [];     // head first
    this.trail = [];        // points the head has visited, oldest first
    this.heading = Math.PI / 2;
    this.speedMul = speedMul;
    this.entered = false;   // false while still walking on from above the screen
    this.age = 0;
    this.phase = Math.random() * Math.PI * 2;
  }
  speed() {
    const f = 1 + (CENTIPEDE_REF_LENGTH - this.segments.length) * 0.07;
    return CENTIPEDE_BASE_SPEED * this.speedMul * Math.max(0.7, Math.min(2.2, f));
  }
  // Advance the head one tick, then drag the body along behind it.
  step(world) {
    const head = this.segments[0];
    const m = CENTIPEDE_HEAD_RADIUS;
    this.age++;

    if (!this.entered) {
      this.heading += wrapAngle(Math.PI / 2 - this.heading) * 0.1;
      if (head.y > 50) this.entered = true;
    } else {
      // How close the head is to a wall, 0 (far) to 1 (touching), and the
      // direction pointing away from it.
      const R = 110;
      let ax = 0;
      let ay = 0;
      if (head.x < R) ax = (R - head.x) / R;
      else if (head.x > world.width - R) ax = -(head.x - (world.width - R)) / R;
      if (head.y < R) ay = (R - head.y) / R;
      else if (head.y > world.height - R) ay = -(head.y - (world.height - R)) / R;
      const wall = Math.min(1, Math.hypot(ax, ay));

      // Weave, plus a gentle bias toward the player that fades near walls.
      let turn = 0.05 * Math.sin(this.age * 0.12 + this.phase) + (Math.random() - 0.5) * 0.03;
      const p = world.player;
      if (!p.dead) {
        const diff = wrapAngle(Math.atan2(p.y - head.y, p.x - head.x) - this.heading);
        turn += Math.max(-0.025, Math.min(0.025, diff)) * (1 - wall);
      }
      // Curve away from walls before reaching them, so the body bends in a
      // smooth arc instead of folding back on itself at a bounce.
      if (wall > 0) {
        const away = wrapAngle(Math.atan2(ay, ax) - this.heading);
        turn += Math.max(-0.07, Math.min(0.07, away)) * wall;
      }
      // Never turn tighter than the body can bend without overlapping itself.
      const maxTurn = this.speed() / 40;
      this.heading += Math.max(-maxTurn, Math.min(maxTurn, turn));
    }

    let x = head.x;
    let y = head.y;
    if (x < m) { x = m; this.heading = Math.PI - this.heading; }
    else if (x > world.width - m) { x = world.width - m; this.heading = Math.PI - this.heading; }
    if (this.entered) {
      if (y < m) { y = m; this.heading = -this.heading; }
      else if (y > world.height - m) { y = world.height - m; this.heading = -this.heading; }
    }
    const s = this.speed();
    this.trail.push({ x: x + Math.cos(this.heading) * s, y: y + Math.sin(this.heading) * s });
    this.place();
  }
  // Put each segment on the trail at its distance behind the head, and drop
  // trail points older than the last segment needs.
  place() {
    const t = this.trail;
    const segs = this.segments;
    let i = 0;
    let travelled = 0;
    let j = t.length - 1;
    segs[0].x = t[j].x;
    segs[0].y = t[j].y;
    segs[0].angle = this.heading;
    for (i = 1; i < segs.length; i++) {
      const target = i * CENTIPEDE_SPACING;
      while (j > 0) {
        const len = Math.hypot(t[j].x - t[j - 1].x, t[j].y - t[j - 1].y);
        if (travelled + len >= target) {
          const f = len === 0 ? 0 : (target - travelled) / len;
          segs[i].x = t[j].x + (t[j - 1].x - t[j].x) * f;
          segs[i].y = t[j].y + (t[j - 1].y - t[j].y) * f;
          break;
        }
        travelled += len;
        j--;
      }
      if (j === 0) {     // ran out of trail: pile up at the oldest point
        segs[i].x = t[0].x;
        segs[i].y = t[0].y;
      }
      const prev = segs[i - 1];
      segs[i].angle = Math.atan2(prev.y - segs[i].y, prev.x - segs[i].x);
    }
    if (j > 1) this.trail = t.slice(j - 1);
  }
  // The point `d` of path length behind the head, with the trail index just
  // older than it and the direction of travel there.
  pointAt(d) {
    const t = this.trail;
    let travelled = 0;
    for (let j = t.length - 1; j > 0; j--) {
      const len = Math.hypot(t[j].x - t[j - 1].x, t[j].y - t[j - 1].y);
      if (travelled + len >= d) {
        const f = len === 0 ? 0 : (d - travelled) / len;
        return {
          index: j - 1,
          x: t[j].x + (t[j - 1].x - t[j].x) * f,
          y: t[j].y + (t[j - 1].y - t[j].y) * f,
          heading: Math.atan2(t[j].y - t[j - 1].y, t[j].x - t[j - 1].x),
        };
      }
      travelled += len;
    }
    return { index: 0, x: t[0].x, y: t[0].y, heading: this.heading };
  }
  // Segment `seg` died: keep the segments in front of it here, and turn the
  // ones behind it into a new chain headed by the next segment.
  cut(seg) {
    const k = this.segments.indexOf(seg);
    if (k < 0) return null;
    const front = this.segments.slice(0, k);
    const back = this.segments.slice(k + 1);
    this.segments = front;
    if (back.length === 0) return null;

    const at = this.pointAt((k + 1) * CENTIPEDE_SPACING);
    const chain = new Chain(this.speedMul);
    chain.segments = back;
    chain.trail = this.trail.slice(0, at.index + 1).concat([{ x: at.x, y: at.y }]);
    chain.heading = at.heading;
    chain.entered = this.entered || at.y > 50;
    chain.age = this.age;
    for (const s of back) s.chain = chain;
    return chain;
  }
}

class Centipede extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y, fireChance, speed);
    this.chain = null;
    this.angle = Math.PI / 2;
    this.age = 0;
    this.w = this.h = CENTIPEDE_RADIUS * 2;
  }
  // Called by Round.spawnWave in place of constructing a single enemy: builds
  // one whole chain, entering from the top edge, tail first so the head is
  // drawn on top.
  static spawnGroup(world, wave) {
    const n = wave.length || 12;
    const chain = new Chain(wave.speed || 1);
    const x = 100 + Math.random() * (world.width - 200);
    const lead = n * CENTIPEDE_SPACING + 60;
    for (let y = -CENTIPEDE_HEAD_RADIUS - lead; y <= -CENTIPEDE_HEAD_RADIUS; y += 2) {
      chain.trail.push({ x, y });
    }
    for (let i = 0; i < n; i++) {
      const seg = new Centipede(x, -CENTIPEDE_HEAD_RADIUS, 0, wave.speed || 1);
      seg.chain = chain;
      chain.segments.push(seg);
    }
    chain.place();
    for (let i = n - 1; i >= 0; i--) world.addEnemy(chain.segments[i]);
  }
  isHead() {
    return this.chain.segments[0] === this;
  }
  get radius() {
    return this.isHead() ? CENTIPEDE_HEAD_RADIUS : CENTIPEDE_RADIUS;
  }
  move(world) {
    this.age++;
    if (this.isHead()) this.chain.step(world);
  }
  onDeath(world) {
    explode(world, this.x, this.y, this.bodyColor(), 2);
    const rest = this.chain.cut(this);
    if (rest && this.chain.segments.length > 0) sfx.crack();
    else sfx.pop();
  }
  contains(px, py) {
    return Math.hypot(px - this.x, py - this.y) < this.radius;
  }
  overlapsPlayer(p) {
    return Math.hypot(p.x - this.x, p.y - this.y) < this.radius + 10;
  }
  // Red at the head fading to green at the tail of its current chain.
  bodyColor() {
    const segs = this.chain.segments;
    const idx = Math.max(0, segs.indexOf(this));
    const f = segs.length > 1 ? idx / (segs.length - 1) : 0;
    return this.isHead() ? '#f64' : `hsl(${40 + 90 * f}, 70%, 50%)`;
  }
  draw(ctx) {
    const r = this.radius;
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);
    const idx = this.chain.segments.indexOf(this);

    // Legs
    ctx.strokeStyle = '#dec';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      const swing = Math.sin(this.age * 0.4 + idx * 0.9) * 5;
      const bx = this.x - dy * side * r * 0.6;
      const by = this.y + dx * side * r * 0.6;
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - dy * side * 8 + dx * swing, by + dx * side * 8 + dy * swing);
    }
    ctx.stroke();

    // Body
    ctx.fillStyle = this.bodyColor();
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(this.x - r * 0.3, this.y - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    if (this.isHead()) {
      // Mandibles
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (const side of [-1, 1]) {
        const sx = this.x + dx * r - dy * side * 5;
        const sy = this.y + dy * r + dx * side * 5;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + dx * 9 - dy * side * -3, sy + dy * 9 + dx * side * -3);
      }
      ctx.stroke();
      // Eyes
      for (const side of [-1, 1]) {
        const ex = this.x + dx * r * 0.35 - dy * side * r * 0.5;
        const ey = this.y + dy * r * 0.35 + dx * side * r * 0.5;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ex + dx * 1.5, ey + dy * 1.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
