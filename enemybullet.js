class EnemyBullet extends GameObject {
  constructor(x, y, vx = 0, vy = 5) {
    super(x, y);
    this.vx = vx;
    this.vy = vy;
    this.radius = 0;   // extra reach when hitting the player
  }
  tick(world) {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y > world.height + 10 || this.y < -10 || this.x < -10 || this.x > world.width + 10) {
      this.dead = true;
    }

    this.hitPlayer(world);
  }
  hitPlayer(world) {
    const p = world.player;
    if (Math.abs(p.x - this.x) < 14 + this.radius && Math.abs(p.y - this.y) < 16 + this.radius) {
      this.dead = true;
      world.playerHit();
    }
  }
  draw(ctx) {
    ctx.strokeStyle = '#f44';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x - this.vx * 1.6, this.y - this.vy * 1.6);
    ctx.lineTo(this.x + this.vx * 1.6, this.y + this.vy * 1.6);
    ctx.stroke();
  }
}

// A little round bullet.
class OrbBullet extends EnemyBullet {
  draw(ctx) {
    ctx.fillStyle = '#f8f';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A big bullet, the size of a pipe opening. It bounces off all four walls
// forever, until the player shoots it.
class BigBullet extends EnemyBullet {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.radius = 12;
    this.shootable = true;
  }
  tick(world) {
    const r = this.radius;
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < r) { this.x = r; this.vx = -this.vx; }
    else if (this.x > world.width - r) { this.x = world.width - r; this.vx = -this.vx; }
    if (this.y < r) { this.y = r; this.vy = -this.vy; }
    else if (this.y > world.height - r) { this.y = world.height - r; this.vy = -this.vy; }
    this.hitPlayer(world);
  }
  onDeath(world) {
    explode(world, this.x, this.y, '#f90', 4);
    sfx.pop();
  }
  draw(ctx) {
    ctx.fillStyle = '#f90';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fd8';
    ctx.beginPath();
    ctx.arc(this.x - 3, this.y - 3, this.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A shell lobbed by a tank: flies in a parabola under gravity. Unlike other
// bullets it may arc above the top of the screen and come back down.
class Shell extends EnemyBullet {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.radius = 2;
    this.gravity = SHELL_GRAVITY;
  }
  tick(world) {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    if (this.y > world.height + 10 || this.x < -10 || this.x > world.width + 10) {
      this.dead = true;
      return;
    }
    this.hitPlayer(world);
  }
  draw(ctx) {
    ctx.fillStyle = '#fc3';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A heavy iron ball from a cannon: a Shell that is bigger.
class Cannonball extends Shell {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy);
    this.radius = 18;
    this.gravity = CANNONBALL_GRAVITY;
  }
  draw(ctx) {
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.33, this.y - this.radius * 0.33, this.radius * 0.33, 0, Math.PI * 2);
    ctx.fill();
  }
}
