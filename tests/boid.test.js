const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./harness');

test('a flock of boids stays on screen, finite, and together', () => {
  const h = load();
  const world = h.sandbox();
  const Boid = h.get('Boid');
  for (let i = 0; i < 50; i++) {
    const { x, y } = Boid.spawnPoint(world);
    world.addEnemy(new Boid(x, y, 0, 1.2));
  }
  for (let i = 0; i < 2000; i++) {
    h.tick();
    for (const b of world.enemies) {
      assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y));
      assert.ok(b.x >= 0 && b.x <= 800 && b.y >= 0 && b.y <= 600);
    }
  }
  const n = world.enemies.length;
  const cx = world.enemies.reduce((a, b) => a + b.x, 0) / n;
  const cy = world.enemies.reduce((a, b) => a + b.y, 0) / n;
  const spread = Math.sqrt(world.enemies.reduce((a, b) => a + (b.x - cx) ** 2 + (b.y - cy) ** 2, 0) / n);
  assert.ok(spread < 250, `spread ${spread}`);
});

test('a boid dies to one shot and hurts on touch', () => {
  const h = load();
  const world = h.sandbox();
  const Boid = h.get('Boid');
  const b = new Boid(400, 300, 0, 1);
  world.addEnemy(b);
  assert.ok(b.contains(400, 300));
  assert.ok(!b.contains(400, 330));
  b.x = world.player.x;
  b.y = world.player.y;
  h.tick();
  assert.ok(h.hits > 0);
  b.hit(world, b.x, b.y);
  assert.ok(b.dead);
});
