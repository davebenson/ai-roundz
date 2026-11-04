const test = require('node:test');
const assert = require('node:assert');
const { load } = require('./harness');

// main.js builds the real round list; these tests run every round.
function setup() {
  const h = load({ main: true });
  const world = h.world;
  world.playerHit = () => {};      // ship can't die
  return { h, world };
}

test('there is a round list', () => {
  const { world } = setup();
  assert.ok(world.rounds.length >= 16);
});

test('every round runs 900 frames, drawn, without errors', () => {
  const { world } = setup();
  for (let i = 0; i < world.rounds.length; i++) {
    world.gotoRound(i);
    for (let f = 0; f < 900; f++) {
      world.tick();
      if (f % 5 === 0) world.draw();
    }
  }
});

test('every round can be cleared by killing its enemies', () => {
  const { world } = setup();
  for (let i = 0; i < world.rounds.length; i++) {
    world.gotoRound(i);
    let frames = 0;
    while (world.roundIndex === i && world.state !== 'won' && frames++ < 8000) {
      world.tick();
      if (world.state === 'playing') for (const e of world.enemies) e.kill(world);
    }
    assert.ok(world.roundIndex !== i || world.state === 'won', `round ${i + 1} never finished`);
  }
});
