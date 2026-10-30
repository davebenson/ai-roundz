// A round is a series of waves. Each wave spawns all its enemies at once, in
// rows of COLS, once the previous wave has been wiped out. The round is done
// once the last wave has spawned.
const COLS = 8;

class Round {
  // waves: [{ count, speed, type, options }]; speed is a multiple of the base
  // enemy speed, type is the Enemy subclass to spawn (default Enemy), and
  // options is passed through to its constructor.
  constructor({ waves, fireChance, waveDelay = 45 }) {
    this.waves = waves;
    this.fireChance = fireChance;   // per enemy tick
    this.waveDelay = waveDelay;     // frames between a wave dying and the next
    this.reset();
  }
  reset() {
    this.waveIndex = 0;
    this.timer = 0;
    this.done = false;
  }
  tick(world) {
    if (this.done || world.enemies.length > 0) return;
    if (this.timer++ < this.waveDelay && this.waveIndex > 0) return;

    this.spawnWave(world, this.waves[this.waveIndex]);
    this.timer = 0;
    if (++this.waveIndex >= this.waves.length) this.done = true;
  }
  spawnWave(world, wave) {
    const { count, speed = 1, type = Enemy, options } = wave;
    // Some types (a centipede) build a whole linked group themselves.
    if (type.spawnGroup) {
      type.spawnGroup(world, wave);
      return;
    }
    for (let i = 0; i < count; i++) {
      const { x, y } = type.spawnPoint ? type.spawnPoint(world, i) : this.gridPoint(world, i);
      world.addEnemy(new type(x, y, this.fireChance, speed, i, options));
    }
  }
  // Default placement: rows of COLS, centered. A type can override this with
  // a static spawnPoint(world).
  gridPoint(world, i) {
    const x0 = (world.width - (COLS - 1) * 66) / 2;
    return { x: x0 + (i % COLS) * 66, y: 60 + Math.floor(i / COLS) * 44 };
  }
}

// A round with no waves: it starts `count` enemies on a timer, one at a time,
// whether or not earlier ones are still around. The gap between starts
// shrinks linearly from startPeriod to endPeriod (in ticks), so later ones
// overlap more.
class TimedRound extends Round {
  constructor({ type, count, startPeriod, endPeriod, speed = 1, fireChance = 0 }) {
    super({ waves: [], fireChance });
    this.type = type;
    this.count = count;
    this.startPeriod = startPeriod;
    this.endPeriod = endPeriod;
    this.speed = speed;
  }
  reset() {
    this.spawned = 0;
    this.timer = 0;
    this.done = false;
  }
  // Gap after the k-th start (k = 0 .. count - 2).
  period(k) {
    if (this.count < 3) return this.startPeriod;
    return this.startPeriod + (this.endPeriod - this.startPeriod) * k / (this.count - 2);
  }
  tick(world) {
    if (this.done) return;
    if (this.spawned > 0 && ++this.timer < this.period(this.spawned - 1)) return;

    this.spawnWave(world, { count: 1, speed: this.speed, type: this.type });
    this.timer = 0;
    if (++this.spawned >= this.count) this.done = true;
  }
}
