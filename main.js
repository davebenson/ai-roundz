const world = new World(document.getElementById('game'));

world.start([
  new Round({
    fireChance: 0.001,
    waves: [
      { count: 8, speed: 1 },
      { count: 8, speed: 2 },
      { count: 8, speed: 3 },
    ],
  }),
  new Round({ fireChance: 0.002, waves: [{ count: 20, speed: 1, type: Bird }] }),
  new Round({ fireChance: 0.003, waves: [{ count: 16, speed: 1, type: Cross }] }),
  new Round({ fireChance: 0.015, waves: [{ count: 1, speed: 1.5, type: Pipe }] }),
  new Round({ fireChance: 0, waves: [{ count: 6, speed: 1, type: Chaser }] }),
  new Round({ fireChance: 0, waves: [{ count: 12, speed: 1, type: Ball }] }),
  new Round({ fireChance: 0.03, waves: [{ count: 3, speed: 1, type: Tank }] }),
  new TimedRound({ type: Mothership, count: 8, startPeriod: 600, endPeriod: 300 }),
  new TimedRound({ type: Acid, count: 50, startPeriod: 30, endPeriod: 30 }),
  new Round({ fireChance: 0.05, waves: [{ count: 2, speed: 1, type: Cannon }] }),
  // Motherships, each dropping off a different kind of enemy.
  new Round({
    fireChance: 0,
    waves: [
      [{ type: Jagged, count: 6 }],
      [{ type: Bird, count: 5, fireChance: 0.002 }],
      [{ type: Cross, count: 4, fireChance: 0.002 }],
      [{ type: Ball, count: 4 }],
      [{ type: Chaser, count: 4 }],
      [{ type: Ball, count: 1 }, { type: Bird, count: 3, fireChance: 0.002 },
       { type: Chaser, count: 2 }, { type: Ball, count: 1 }],
    ].map(drops => ({ count: 1, speed: 1, type: Mothership, options: { drops } })),
  }),
  new Round({
    fireChance: 0,
    waves: [12, 16, 20].map(length => ({ type: Centipede, length, speed: 1 })),
  }),
  new Round({ fireChance: 0, waves: [{ count: 8, speed: 1, type: Teleporter }] }),
  new Round({
    fireChance: 0,
    waves: [{ count: 30, speed: 1, type: Boid }, { count: 50, speed: 1.2, type: Boid }],
  }),
  new Round({
    fireChance: 0,
    waves: [[6, 1], [8, 1.2], [10, 1.4]].map(([count, speed]) => ({ count, speed, type: Boomerang })),
  }),
  new Round({ fireChance: 0.02, waves: [{ count: 2, speed: 1, type: FireworkCannon }] }),
]);

// R restarts after game over / winning. C starts the round cheat: type a
// 2-digit round number (e.g. 0 2) to jump there. Escape cancels. M mutes.
// B toggles the background.
addEventListener('keydown', e => {
  sfx.unlock();   // browsers only allow audio after a user gesture
  if (e.repeat) return;
  if (e.code === 'KeyR' && (world.state === 'won' || world.state === 'lost')) {
    world.startGame(0);
  } else if (e.code === 'KeyB') {
    world.atmosphere.enabled = !world.atmosphere.enabled;
  } else if (e.code === 'KeyM') {
    sfx.toggleMute();
  } else if (e.code === 'KeyC') {
    world.cheatInput = '';
  } else if (e.code === 'Escape') {
    world.cheatInput = null;
  } else if (world.cheatInput !== null && /^[0-9]$/.test(e.key)) {
    world.cheatInput += e.key;
    if (world.cheatInput.length === 2) {
      world.gotoRound(parseInt(world.cheatInput, 10) - 1);
      world.cheatInput = null;
    }
  }
});

function frame() {
  world.tick();
  world.draw();
  requestAnimationFrame(frame);
}
frame();
