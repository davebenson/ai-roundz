// Enemies march together as a fleet. Each enemy moves sideways every tick;
// when one touches a wall it flags the fleet, and the world turns everyone
// around and drops them at the end of the frame.
class Enemy extends GameObject {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y);
    this.fireChance = fireChance;   // per tick
    this.color = '#4f4';
    this.w = 32;
    this.h = 24;
    this.step = speed;   // pixels moved per tick
    this.drop = 20;  // pixels descended when the fleet turns around
  }
  tick(world) {
    if (Math.random() < this.fireChance) this.fire(world);
    this.move(world);

    if (!world.player.dead && this.overlapsPlayer(world.player)) world.playerHit();
  }
  // Does the point (px, py) lie inside this enemy? (For player bullets.)
  contains(px, py) {
    return Math.abs(this.x - px) < this.w / 2 && Math.abs(this.y - py) < this.h / 2;
  }
  // A player bullet hit the enemy at (px, py). Most enemies just die.
  hit(world, px, py) {
    this.kill(world);
  }
  overlapsPlayer(p) {
    return Math.abs(p.x - this.x) < this.w / 2 + 10 && Math.abs(p.y - this.y) < this.h / 2 + 12;
  }
  move(world) {
    this.x += world.fleet.dir * this.step;
    if (this.x < this.w || this.x > world.width - this.w) world.fleet.hitEdge = true;
  }
  // Diagonal flight that reflects off all four screen edges. For subclasses
  // that set `dir` (horizontal) and `vdir` (vertical), each +1 or -1.
  bounce(world) {
    this.x += this.dir * this.step;
    if (this.x < this.w) {
      this.x = this.w;
      this.dir = 1;
    } else if (this.x > world.width - this.w) {
      this.x = world.width - this.w;
      this.dir = -1;
    }

    this.y += this.vdir * this.step;
    if (this.y > world.height - this.h / 2) {
      this.y = world.height - this.h / 2;
      this.vdir = -1;
    } else if (this.y < this.h / 2) {
      this.y = this.h / 2;
      this.vdir = 1;
    }
  }
  fire(world) {
    world.add(new EnemyBullet(this.x, this.y + this.h / 2));
    sfx.enemyShot();
  }
  onDeath(world) {
    explode(world, this.x, this.y, this.color);
    sfx.explosion();
  }
  draw(ctx) {
    const { x, y, w, h } = this;
    // Body
    ctx.fillStyle = this.color;
    ctx.fillRect(x - w / 2, y - h / 2, w, h * 0.6);
    // Legs
    ctx.fillRect(x - w / 2, y + h * 0.1, 6, h * 0.4);
    ctx.fillRect(x + w / 2 - 6, y + h * 0.1, 6, h * 0.4);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x - 6, y - 4, 3, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
