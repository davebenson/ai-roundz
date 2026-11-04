const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./harness');

test('teleporter hops faster over time, firing straight down at each stop', () => {
  const h = load();
  const world = h.sandbox();
  const t = new (h.get('Teleporter'))(100, 100, 0, 1, 0);
  world.addEnemy(t);

  const hopTicks = [];
  let lastX = t.x;
  let lastBullets = 0;
  for (let i = 0; i < 4000; i++) {
    h.tick();
    if (t.x !== lastX) { hopTicks.push(i); lastX = t.x; }
    const orbs = world.objects.filter(o => o instanceof (h.get('OrbBullet')));
    if (orbs.length > lastBullets) {
      const o = orbs[orbs.length - 1];
      assert.strictEqual(o.vx, 0);
      assert.ok(o.vy > 0, 'bullet heads down');
      assert.strictEqual(o.x, t.x);
    }
    lastBullets = orbs.length;
  }
  const gaps = hopTicks.slice(1).map((v, i) => v - hopTicks[i]);
  assert.ok(gaps.length > 20);
  assert.ok(gaps[0] > 100, `first gap ${gaps[0]}`);
  assert.ok(Math.abs(gaps.at(-1) - 50) <= 2, `last gap ${gaps.at(-1)}`);
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] <= gaps[i - 1] + 1);
});

test('teleporter can only be shot or hurt you while mostly solid', () => {
  const h = load();
  const world = h.sandbox();
  const t = new (h.get('Teleporter'))(300, 200, 0, 1, 0);
  world.addEnemy(t);
  t.alpha = 0.3;
  assert.strictEqual(t.contains(300, 200), false);
  assert.strictEqual(t.overlapsPlayer({ x: 300, y: 200 }), false);
  t.alpha = 1;
  assert.strictEqual(t.contains(300, 200), true);
  assert.strictEqual(t.overlapsPlayer({ x: 300, y: 200 }), true);
});
