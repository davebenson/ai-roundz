// A bird flaps its wings and shoots down either diagonal at random. Birds
// start at random spots in the top third of the screen, fly down and
// sideways, and bounce off all four edges, independent of the fleet.
class Bird extends Enemy {
  constructor(x, y, fireChance = 0, speed = 1) {
    super(x, y, fireChance, speed);
    this.color = '#fa3';
    this.age = Math.random() * 100;   // desynchronize the flapping
    this.dir = Math.random() < 0.5 ? -1 : 1;   // horizontal
    this.vdir = 1;                              // vertical: 1 = down, -1 = up
  }
  static spawnPoint(world) {
    return {
      x: 40 + Math.random() * (world.width - 80),
      y: 40 + Math.random() * (world.height / 3 - 40),
    };
  }
  tick(world) {
    super.tick(world);
    this.age++;
  }
  move(world) {
    this.bounce(world);
  }
  fire(world) {
    const vx = Math.random() < 0.5 ? -4 : 4;
    world.add(new EnemyBullet(this.x, this.y + this.h / 2, vx, 4));
    sfx.enemyShot();
  }
  draw(ctx) {
    const { x, y } = this;
    const flap = Math.sin(this.age * 0.2);   // -1 (wings down) .. 1 (wings up)
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    // Wings
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x - 18, y - 4 - flap * 10);
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 18, y - 4 - flap * 10);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.arc(x, y - 7, 5, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = '#e33';
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 4);
    ctx.lineTo(x + 3, y - 4);
    ctx.lineTo(x, y + 1);
    ctx.closePath();
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x - 2, y - 8, 1.2, 0, Math.PI * 2);
    ctx.arc(x + 2, y - 8, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
