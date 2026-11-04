// Loads the game's scripts (in index.html order) into a Node vm context with
// a stubbed canvas, so rules can be tested without a browser. Seeded Math.random
// keeps runs repeatable.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

// A stand-in for anything canvas-shaped: every property is a function that
// returns the same stand-in, and assignments are ignored.
function deepStub() {
  const f = function () {};
  const p = new Proxy(f, {
    get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : p),
    set: () => true,
    apply: () => p,
  });
  return p;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// opts.main: also run main.js, which builds the real round list in `world`.
function load({ seed = 1, main = false } = {}) {
  const canvas = { width: 800, height: 600, getContext: () => deepStub() };
  const ctx = vm.createContext({
    console,
    performance: { now: () => 0 },
    document: { getElementById: () => canvas },
    addEventListener() {},
    requestAnimationFrame() {},
    canvas,
    rng: mulberry32(seed),
  });
  vm.runInContext('Math.random = rng', ctx);

  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  for (const file of scripts) {
    if (file === 'main.js' && !main) continue;
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  }

  const get = name => vm.runInContext(name, ctx);
  const h = { ctx, get, run: code => vm.runInContext(code, ctx) };

  // A world with one never-finishing empty round, in the playing state, so
  // a test can add exactly the objects it wants. The ship can't be killed
  // unless opts.mortal is set.
  h.sandbox = ({ mortal = false } = {}) => {
    const world = h.run('new World(canvas)');
    world.rounds = [{ reset() {}, tick() {}, done: false }];
    world.startGame(0);
    world.state = 'playing';
    h.hits = 0;
    if (!mortal) world.playerHit = () => { h.hits++; };
    h.world = world;
    return world;
  };
  h.tick = (n = 1, draw = false) => {
    for (let i = 0; i < n; i++) {
      h.world.tick();
      if (draw) h.world.draw();
    }
  };
  if (main) h.world = get('world');
  return h;
}

module.exports = { load };
