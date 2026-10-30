# Round ideas

Brainstorm of possible rounds beyond the ones already built. Each entry has the
core idea, what it would reuse, a rough effort (**S** about an hour, **M** an
evening, **L** more than that), and the main risk. See also `ideas-bosses.md`.

Existing rounds, for reference: grid aliens in 3 speed waves, birds, crosses,
the spinning pipe, chasers, bouncing/bomb-laying balls, tanks, timed
motherships, acid drops, cannons, and mothership loads (each drops a different
enemy type).

## New kinds of danger (not just bullets)

### Sweeping lasers
- **Idea**: a turret shows a thin warning line, pauses, then fires a thick beam
  that sweeps across an arc. Survival is about timing, not shooting.
- **Details**: telegraph (1 s thin line), fire (0.5 s thick `fillRect`/polygon
  rotated about the turret), cooldown. Several turrets on different rhythms.
  Beam hit test is the same rotated-rect check as `Pipe.local()`.
- **Reuses**: `Pipe` geometry, `sfx.tone` for the charge-up whine.
- **Effort**: S-M. **Risk**: unfair if the telegraph isn't clear; the warning
  needs to be unmistakable.

### Tripwire pairs
- **Idea**: two enemies drift around with a live beam between them. Touching the
  beam hurts; killing either one removes the beam.
- **Details**: segment-vs-circle distance for the beam. Kill order matters when
  pairs share partners (chains of three).
- **Reuses**: `Ball`/`Jagged` movement, bounce code.
- **Effort**: S. **Risk**: a beam that rotates fast can sweep the player with no
  warning, so cap relative speed.

### Lightning pylons
- **Idea**: pylons along the edges; an arc jumps between pairs on a rhythm. You
  stay out of the gap between a charging pair.
- **Details**: charge glow, then a jagged polyline (re-randomized per draw like
  `Jagged`) that does damage while visible.
- **Reuses**: `Jagged`'s random-radius drawing trick, `sfx.noise`.
- **Effort**: S. **Risk**: pylons need to be destroyable or the round has no end;
  decide a kill rule.

### Gravity wells
- **Idea**: a black hole pulls the player's ship and every bullet toward it, so
  shots curve. Enemies orbit it.
- **Details**: acceleration `k / d^2` on `Player`, `Bullet`, `EnemyBullet`, and
  orbiters. Same inverse-square formula the `Chaser` uses, with the centre
  fixed. Event horizon in the middle kills or absorbs.
- **Reuses**: `Chaser` thrust math, `Shell` gravity.
- **Effort**: M (needs player and bullets to accept external forces).
  **Risk**: player control feels bad if the pull is too strong; add a visible
  field.

### Wind
- **Idea**: a steady sideways push on the ship that flips direction every few
  seconds, with debris falling through.
- **Details**: a per-round `world.wind` vector added to the player's `x`; debris
  as `Shell`s or `Acid`. Streak lines drawn for readability.
- **Reuses**: `Acid` falling code, `Shell`.
- **Effort**: S. **Risk**: dull on its own; works best combined with another
  round's enemies.

## New enemy shapes and behaviors

### Centipede (in design: see `design-centipede.md`)
- **Idea**: a chain of segments that follows its head's path. Shooting a middle
  segment splits it into two chains, each with its own head.
- **Reuses**: `Enemy` hit/contains, `Ball`-style circle collision, bounce code.
- **Effort**: M. **Risk**: chain bookkeeping on splits.

### Asteroids
- **Idea**: big rocks that split into smaller, faster ones when shot.
- **Details**: random polygon outlines (jagged-circle code with a fixed seed per
  rock), slow rotation, drift and wrap or bounce. Three sizes.
- **Reuses**: `Jagged` outline, `Ball` bounce, `explode()`.
- **Effort**: S. **Risk**: screen floods with fragments; cap the split count.

### Boids (flocking swarm)
- **Idea**: a swarm using cohesion, separation, and alignment that curls
  around the player.
- **Details**: each boid reads neighbours (O(n^2) is fine for ~40), adds a small
  attraction to the player, caps speed. Draw as small triangles pointing along
  velocity.
- **Reuses**: `Chaser` thrust and turn limits.
- **Effort**: S-M. **Risk**: tuning the weights; the swarm either clumps or
  disperses until the numbers are right.

### Tentacles
- **Idea**: a rope of linked segments anchored to an edge that whips toward the
  player. Cutting it kills everything beyond the cut.
- **Details**: Verlet-style chain with fixed segment lengths, an anchor, and a
  target the tip is pulled toward. Hit-testing is circle-per-segment.
- **Reuses**: the centipede's segment-chain bookkeeping (build them together).
- **Effort**: M. **Risk**: physical stability of the rope at high speed.

### Orbitals
- **Idea**: a ring of satellites around an invulnerable core. Shoot satellites to
  open a gap, then hit the core.
- **Details**: satellites at `angle + k * 2*pi/n`, ring rotates and breathes;
  core has hp and only counts as hittable once the ring is under half.
- **Reuses**: `Pipe` rotation math, `Cannon`/`Tank` hp.
- **Effort**: S. **Risk**: easy to make the core trivial; place satellites so a
  straight shot is always blocked.

### Blinkers
- **Idea**: enemies that teleport and are only shootable while solid. A shimmer
  warns where they will reappear.
- **Details**: state machine solid, fading, gone, shimmer, solid. `contains()`
  returns false when not solid.
- **Reuses**: `Jagged` shimmer drawing.
- **Effort**: S. **Risk**: players will shoot where they were; add a reappear
  tell.

## Rule twists

### Armor
- **Idea**: shielded enemies that can only be hurt from the side or back, with
  rotating shields.
- **Details**: `hit(world, px, py)` checks the bullet's angle relative to the
  shield; front hits clang. The shield can sweep slowly so there is a
  window.
- **Reuses**: `Pipe.hit()` (clang when absorbed).
- **Effort**: S. **Risk**: confusing unless the shield is drawn clearly.

### Reflectors
- **Idea**: an enemy that bounces the player's bullets back at an angle.
- **Details**: `hit()` spawns a bullet moving with a reflected velocity (a new
  `Reflected` that hurts the player).
- **Reuses**: `EnemyBullet`, bounce code.
- **Effort**: S. **Risk**: indirect fire can be frustrating; telegraph the angle.

### Darkness
- **Idea**: the screen is black except a spotlight around the player; enemies
  are visible only when close, so bullets come out of the dark.
- **Details**: draw the world, then overlay a black layer with a radial-gradient
  hole (canvas `globalCompositeOperation`). Enemy bullets glow so they are
  visible late.
- **Reuses**: nothing new in game logic, only the draw pass.
- **Effort**: S. **Risk**: unfair if enemies can't be seen at all; keep a dim
  ambient light.

### Mirror
- **Idea**: ghost enemies that copy your movement inverted, so they close in if
  you stay still.
- **Details**: ghost `x = width - player.x`, with a delay buffer so the motion
  is a lagged echo; touching one costs a life, shooting it stuns it.
- **Reuses**: `Chaser`-style tracking, simple trail buffer.
- **Effort**: S. **Risk**: players can't predict inverted motion; try a short
  delay first.

### Breakout
- **Idea**: the enemies are bricks and a big ball bounces off walls, bricks, and
  the player.
- **Details**: ball with elastic bounce (reuse `Ball.collide`), bricks that die
  on contact, the ship acts as a paddle. Round ends when bricks are gone.
- **Reuses**: `Ball` physics, `Bomb` if bricks drop bombs.
- **Effort**: M. **Risk**: a paddle that also shoots is a hard control mix.

### Meteor warnings
- **Idea**: shadows on the floor show where meteors will land a second later.
- **Details**: telegraph circle growing for 60 ticks, then a fast falling object
  with `Acid`-style acceleration, then a short-lived crater hazard.
- **Reuses**: `Acid` falling, `Bomb` growth drawing.
- **Effort**: S. **Risk**: indistinguishable from the acid round; vary visuals.

## Ones that lean on the generative sound

### Rhythm round
- **Idea**: enemies fire on the beat of a generated drum loop; player shots
  landing on the beat get a bonus. Tempo rises per wave.
- **Details**: a scheduler with Web Audio times (`ctx.currentTime`) driving
  kick/snare noise voices; world ticks sync to the beat grid.
- **Reuses**: `sfx.noise`/`tone`; `Ball` notes for melodic parts.
- **Effort**: M-L. **Risk**: timing drift between the audio clock and the
  frame loop; schedule from the audio clock.

### Chord shooter
- **Idea**: each enemy has a note; killing them in chord order clears faster.
  Wrong notes respawn something.
- **Details**: reuses the A minor 7th table from the ball round; HUD shows the
  next note; a cleanly played arpeggio plays automatically at the end.
- **Reuses**: `BALL_NOTES`, `sfx.note()`.
- **Effort**: M. **Risk**: a rule players can't see without a UI cue.

## Suggested order

1. **Centipede**: chain bookkeeping that tentacles can reuse.
2. **Asteroids**: cheap and recognizable.
3. **Boids**: pure generative fun.
4. **Sweeping lasers** or **gravity wells** next, since they add a different kind
   of danger rather than another enemy.
