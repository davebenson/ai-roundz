const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./harness');

for (const [side, x0] of [['left', -30], ['right', 830]]) {
  test(`boomerang from the ${side} turns near the far side and leaves home`, () => {
    const h = load();
    const world = h.sandbox();
    const b = new (h.get('Boomerang'))(x0, 150, 0, 1, 0);
    world.addEnemy(b);
    const dir = x0 < 400 ? 1 : -1;
    let far = x0, ticks = 0;
    while (!b.dead && ticks < 1000) {
      h.tick();
      ticks++;
      if (!b.dead) far = dir > 0 ? Math.max(far, b.x) : Math.min(far, b.x);
    }
    assert.ok(b.dead, 'flies home and disappears');
    const frac = dir > 0 ? far / 800 : (800 - far) / 800;
    assert.ok(frac > 0.8 && frac < 0.97, `reach ${frac}`);
    assert.ok(Math.abs(ticks - 260) <= 2, `flight time ${ticks}`);
  });
}

test('a waiting boomerang is harmless and unshootable', () => {
  const h = load();
  const world = h.sandbox();
  const b = new (h.get('Boomerang'))(-30, 150, 0, 1, 3);
  world.addEnemy(b);
  assert.strictEqual(b.contains(b.x, b.y), false);
  assert.strictEqual(b.overlapsPlayer({ x: b.x, y: b.y }), false);
});
