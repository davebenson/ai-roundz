// A short-lived spark that flies in a straight line and fades out.
class Particle extends GameObject {
  constructor(x, y, vx, vy, color, life = 30) {
    super(x, y);
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
  }
  tick(world) {
    this.x += this.vx;
    this.y += this.vy;
    if (--this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  }
}

// Emit 8 particles, one per compass direction.
function explode(world, x, y, color, speed = 3) {
  world.atmosphere.shock(x, y, speed);
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    world.add(new Particle(x, y, Math.cos(a) * speed, Math.sin(a) * speed, color));
  }
}
