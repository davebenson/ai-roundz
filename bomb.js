// A bomb laid where two balls collided. It starts tiny and flashes between
// its parents' colors. Once it has grown to the parents' radius it fades to
// solid red while still growing, and at 4x that radius it explodes.
// It extends EnemyBullet so it hurts the player and is cleaned up with the
// other hostile projectiles.
const BOMB_START_RADIUS = 3;
const BOMB_GROWTH = 0.3;       // pixels per tick
const BOMB_EXPLODE_FACTOR = 4;
const BOMB_FLASH_TICKS = 6;

class Bomb extends EnemyBullet {
  constructor(x, y, colorA, colorB, parentRadius) {
    super(x, y, 0, 0);
    this.colors = [colorA, colorB];
    this.parentRadius = parentRadius;
    this.radius = BOMB_START_RADIUS;
    this.age = 0;
  }
  tick(world) {
    this.age++;
    this.radius += BOMB_GROWTH;
    if (this.radius >= this.parentRadius * BOMB_EXPLODE_FACTOR) {
      this.detonate(world);
      return;
    }
    this.hitPlayer(world);
  }
  // For now an exploding bomb just disappears.
  detonate(world) {
    this.dead = true;
  }
  hitPlayer(world) {
    const p = world.player;
    if (Math.hypot(p.x - this.x, p.y - this.y) < this.radius + 10) {
      this.dead = true;
      world.playerHit();
    }
  }
  // 0 until the bomb reaches the parents' radius, then ramps to 1 at detonation.
  redness() {
    const span = this.parentRadius * (BOMB_EXPLODE_FACTOR - 1);
    return Math.max(0, Math.min(1, (this.radius - this.parentRadius) / span));
  }
  draw(ctx) {
    const flash = Math.floor(this.age / BOMB_FLASH_TICKS) % 2;
    ctx.fillStyle = this.colors[flash];
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    const red = this.redness();
    if (red > 0) {
      ctx.globalAlpha = red;
      ctx.fillStyle = '#f00';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
