const INTRO_FRAMES = 120;

class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.objects = [];          // everything: ticked every frame
    this.enemies = [];          // the Enemy objects in `objects`, for queries
    this.fleet = { dir: 1, hitEdge: false };

    this.player = null;
    this.lives = 3;
    this.rounds = [];
    this.roundIndex = -1;
    this.round = null;
    this.state = 'intro';       // intro | playing | won | lost
    this.introTimer = 0;
    this.cheatInput = null;     // digits typed so far while in cheat mode
    this.atmosphere = new Atmosphere(this.width, this.height);
  }
  add(obj) {
    this.objects.push(obj);
  }
  addEnemy(enemy) {
    this.add(enemy);
  }
  start(rounds) {
    this.rounds = rounds;
    this.startGame(0);
  }
  // Brand-new game at round index i: full lives, empty world, fresh ship.
  startGame(i) {
    this.lives = 3;
    this.objects = [];
    this.enemies = [];
    this.spawnPlayer();
    this.startRound(i);
  }
  spawnPlayer() {
    this.player = new Player(this.width / 2, this.height - 60);
    this.add(this.player);
  }
  // Cheat: jump to round index i, keeping the current ship and lives. If the
  // game is over, this starts a new game at that round instead.
  gotoRound(i) {
    if (i < 0 || i >= this.rounds.length) return;
    if (this.player.dead) {
      this.startGame(i);
      return;
    }
    this.objects = [this.player];
    this.enemies = [];
    this.startRound(i);
  }
  startRound(i) {
    this.roundIndex = i;
    this.round = this.rounds[i];
    this.round.reset();
    this.atmosphere.setTheme(i);
    this.state = 'intro';
    this.introTimer = INTRO_FRAMES;
    this.fleet = { dir: 1, hitEdge: false };
    sfx.roundStart();
  }
  // The player was hit: everything else on screen dies, then the round
  // restarts with a fresh ship, or the game ends if no lives remain.
  playerHit() {
    if (this.player.dead) return;
    this.player.kill(this);
    for (const o of this.objects) {
      if (o instanceof Enemy) o.kill(this);
      else if (o instanceof EnemyBullet) o.dead = true;
    }
    if (--this.lives <= 0) {
      this.state = 'lost';
      sfx.gameOver();
      return;
    }
    this.spawnPlayer();
    this.startRound(this.roundIndex);
  }
  tick() {
    this.atmosphere.tick();
    if (this.state === 'playing') this.round.tick(this);

    // Index loop so objects added during a tick (bullets) are safe to push.
    for (let i = 0; i < this.objects.length; i++) {
      if (!this.objects[i].dead) this.objects[i].tick(this);
    }
    this.objects = this.objects.filter(o => !o.dead);
    this.enemies = this.objects.filter(o => o instanceof Enemy);
    this.turnFleet();

    if (this.state === 'intro') {
      if (--this.introTimer <= 0) this.state = 'playing';
    } else if (this.state === 'playing') {
      if (this.round.done && this.enemies.length === 0) this.nextRound();
    }
  }
  nextRound() {
    for (const o of this.objects) if (o instanceof EnemyBullet) o.kill(this);
    if (this.roundIndex + 1 < this.rounds.length) this.startRound(this.roundIndex + 1);
    else {
      this.state = 'won';
      sfx.win();
    }
  }
  // If any enemy touched a wall this frame, reverse the fleet and drop it.
  turnFleet() {
    const f = this.fleet;
    if (!f.hitEdge) return;
    f.hitEdge = false;
    f.dir = -f.dir;
    for (const e of this.enemies) {
      e.y += e.drop;
      if (e.y > this.height - 60) {
        this.playerHit();
        break;
      }
    }
  }
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.atmosphere.draw(this.ctx);
    for (const o of this.objects) o.draw(this.ctx);
    this.drawLives();
    this.drawBanner();
    this.drawCheat();
  }
  drawCheat() {
    if (this.cheatInput === null) return;
    const ctx = this.ctx;
    ctx.fillStyle = '#ff0';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`Cheat: go to round ${this.cheatInput.padEnd(2, '_')}`, 10, this.height - 10);
  }
  drawLives() {
    for (let i = 0; i < this.lives; i++) {
      Player.drawShip(this.ctx, this.width - 30 - i * 32, 28, 0.6);
    }
  }
  drawBanner() {
    let text = null;
    if (this.state === 'intro') text = `Round ${this.roundIndex + 1}`;
    else if (this.state === 'won') text = 'You Won!';
    else if (this.state === 'lost') text = 'Game Over';
    if (!text) return;

    const ctx = this.ctx;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.width / 2, this.height / 2);

    if (this.state === 'won' || this.state === 'lost') {
      ctx.font = '24px monospace';
      ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 50);
    }
  }
}
