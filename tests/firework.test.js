const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./harness');

test('rockets burst into 90 bullets with a fixed angle step in range', () => {
  const h = load();
  const world = h.sandbox();
  const FireworkCannon = h.get('FireworkCannon');
  const OrbBullet = h.get('OrbBullet');
  const Firework = h.get('Firework');
  const Rocket = h.get('Rocket');

  for (let n = 0; n < 12; n++) {
    world.objects = [world.player];
    const left = n % 2 === 0;
    const c = new FireworkCannon(left ? -60 : 860, 30 + (n * 7) % 60, 0, 1, left ? 0 : 1);
    world.addEnemy(c);
    for (let i = 0; i < 200; i++) c.move(world);
    c.cooldown = 0;
    c.fire(world);

    const rocket = world.objects.find(o => o instanceof Rocket);
    assert.ok(rocket);
    let fw = null;
    for (let i = 0; i < 1000 && !fw; i++) {
      rocket.tick(world);
      fw = world.objects.find(o => o instanceof Firework);
    }
    assert.ok(fw, 'rocket burst');
    assert.ok(fw.y > c.y && fw.y < 450, `burst height ${fw.y}`);
    assert.ok(fw.x > 100 && fw.x < 700, `burst x ${fw.x}`);

    const deg = Math.abs(fw.delta) * 180 / Math.PI;
    assert.ok(deg >= 5 - 1e-9 && deg <= 180 + 1e-9, `delta ${deg}`);

    const before = world.objects.filter(o => o instanceof OrbBullet).length;
    const angles = [];
    for (let i = 0; i < 200 && !fw.dead; i++) {
      const prev = world.objects.length;
      fw.tick(world);
      const b = world.objects[prev];
      angles.push(Math.atan2(b.vy, b.vx));
      assert.ok(Math.abs(Math.hypot(b.vx, b.vy) - 2.8) < 1e-9);
    }
    assert.strictEqual(angles.length, 90);
    for (let i = 1; i < angles.length; i++) {
      let d = angles[i] - angles[i - 1] - fw.delta;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      assert.ok(Math.abs(d) < 1e-9);
    }
    assert.strictEqual(world.objects.filter(o => o instanceof OrbBullet).length - before, 90);
  }
});

test('both signs of angle step occur', () => {
  const h = load({ seed: 7 });
  const world = h.sandbox();
  const Rocket = h.get('Rocket');
  const Firework = h.get('Firework');
  const signs = new Set();
  for (let i = 0; i < 30; i++) {
    const r = new Rocket(400, 100, 0, 0, 1);
    r.burst(world);
    signs.add(Math.sign(world.objects.filter(o => o instanceof Firework).pop().delta));
  }
  assert.deepStrictEqual([...signs].sort(), [-1, 1]);
});
