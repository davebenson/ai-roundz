class Player extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.speed = 5;
    this.cooldown = 0;
    this.fireDelay = 12;  // ticks between shots
  }
  tick(world) {
    if (keys.has('ArrowLeft'))  this.x -= this.speed;
    if (keys.has('ArrowRight')) this.x += this.speed;
    if (keys.has('ArrowUp'))    this.y -= this.speed;
    if (keys.has('ArrowDown'))  this.y += this.speed;

    this.x = Math.max(20, Math.min(world.width - 20, this.x));
    this.y = Math.max(20, Math.min(world.height - 20, this.y));

    if (this.cooldown > 0) this.cooldown--;
    if (keys.has('Space') && this.cooldown === 0) {
      world.add(new Bullet(this.x, this.y - 20));
      sfx.playerShot();
      this.cooldown = this.fireDelay;
    }
  }
  onDeath(world) {
    explode(world, this.x, this.y, '#4af');
    sfx.playerDeath();
  }
  draw(ctx) {
    Player.drawShip(ctx, this.x, this.y, 1);
  }
  // Also used for the lives icons.
  static drawShip(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    // Hull
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(16, 16);
    ctx.lineTo(0, 8);
    ctx.lineTo(-16, 16);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
