const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./harness');

function spawn(h, length) {
  const world = h.sandbox();
  const Centipede = h.get('Centipede');
  Centipede.spawnGroup(world, { length, speed: 1 });
  h.tick(300);
  return world.enemies.filter(e => e instanceof Centipede);
}

test('a chain keeps its segments spaced along the path', () => {
  const h = load();
  const segs = spawn(h, 12);
  const chain = segs[0].chain;
  assert.strictEqual(chain.segments.length, 12);
  const spacing = h.get('CENTIPEDE_SPACING');
  for (let t = 0; t < 600; t++) {
    h.tick();
    const s = chain.segments;
    for (let i = 1; i < s.length; i++) {
      const d = Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
      assert.ok(d <= spacing * 1.05, `gap ${d} at tick ${t}`);
    }
  }
});

test('shooting a middle segment splits the chain in two', () => {
  const h = load();
  const segs = spawn(h, 12);
  const world = h.world;
  const ordered = segs[0].chain.segments.slice();
  const before = ordered[6];
  const pos = [ordered[7].x, ordered[7].y];
  before.hit(world, before.x, before.y);
  h.tick();
  const front = ordered[0].chain;
  const back = ordered[7].chain;
  assert.notStrictEqual(front, back);
  assert.strictEqual(front.segments.length, 6);
  assert.strictEqual(back.segments.length, 5);
  assert.ok(Math.hypot(ordered[7].x - pos[0], ordered[7].y - pos[1]) < 10, 'new head did not jump');
});

test('killing the head or tail just shortens the chain', () => {
  const h = load();
  const segs = spawn(h, 12);
  const ordered = segs[0].chain.segments.slice();
  ordered[0].hit(h.world, 0, 0);
  ordered[11].hit(h.world, 0, 0);
  // Losing the head hands the rest to a new chain headed by segment 1.
  const rest = ordered[1].chain;
  assert.strictEqual(rest.segments.length, 10);
  assert.strictEqual(rest.segments[0], ordered[1]);
});
