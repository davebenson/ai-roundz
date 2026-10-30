// A plus-shaped enemy that bounces around at 45-degree diagonals and shoots
// round bullets north, south, east or west at random.
class Cross extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y, fireChance, speed);
    this.color = '#c6f';
    this.w = 28;
    this.h = 28;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.vdir = Math.random() < 0.5 ? -1 : 1;
  }
  static spawnPoint(world) {
    return {
      x: 40 + Math.random() * (world.width - 80),
      y: 40 + Math.random() * (world.height / 2 - 40),
    };
  }
  move(world) {
    this.bounce(world);
  }
  fire(world) {
    const dirs = [[0, -4], [0, 4], [-4, 0], [4, 0]];
    const [vx, vy] = dirs[Math.floor(Math.random() * 4)];
    world.add(new OrbBullet(this.x, this.y, vx, vy));
    sfx.enemyShot();
  }
  draw(ctx) {
    const { x, y } = this;
    ctx.fillStyle = this.color;
    ctx.fillRect(x - 14, y - 4, 28, 8);
    ctx.fillRect(x - 4, y - 14, 8, 28);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
