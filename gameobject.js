// Base class for everything in the world.
class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false;   // set true to have the world remove this object
  }
  kill(world) {          // mark dead and run death effects, once
    if (this.dead) return;
    this.dead = true;
    this.onDeath(world);
  }
  onDeath(world) {}
  tick(world) {}         // update state; called periodically
  draw(ctx) {}           // render using Canvas primitives
}
