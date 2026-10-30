class Bullet extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.speed = 10;
  }
  tick(world) {
    this.y -= this.speed;
    if (this.y < -10) this.dead = true;

    for (const e of world.enemies) {
      if (!e.dead && e.contains(this.x, this.y)) {
        e.hit(world, this.x, this.y);
        this.dead = true;
        return;
      }
    }
    for (const o of world.objects) {
      if (o.shootable && !o.dead && Math.hypot(o.x - this.x, o.y - this.y) < o.radius + 3) {
        o.kill(world);
        this.dead = true;
        return;
      }
    }
  }
  draw(ctx) {
    ctx.fillStyle = '#ff0';
    ctx.fillRect(this.x - 2, this.y - 8, 4, 16);
  }
}
