# Boss ideas

Quick-and-dirty boss concepts, each built mostly from pieces the game already
has. Effort is a rough guess: **S** is an hour or so, **M** is an evening.

## Shared scaffolding (do this once, any boss benefits)

- **`Boss extends Enemy`** with `hp`, `maxHp`, and a `phase` computed from the
  hp fraction (e.g. phase 2 below 66%, phase 3 below 33%).
- **Health bar**: a wide `fillRect` across the top, drawn by `World.drawHud()`
  when a living `Boss` exists. This is also where the round's "BOSS" banner
  can hook in.
- **Hit feedback**: flash the boss white for a few ticks on each hit, play
  `sfx.clang()`. Without it, 40-hit bosses feel dead.
- **Death**: chain of `explode()` calls over ~60 ticks around the boss's
  bounds, then `sfx.bigExplosion()`. Kill leftover minions and bullets (the
  `nextRound` cleanup already clears `EnemyBullet`s).
- **Round**: `new Round({ fireChance, waves: [{ count: 1, type: TheBoss }] })`.
  The round ends when the boss dies, so nothing else is needed.
- **Phase hook**: `onPhase(world, n)` called once when `phase` changes, for
  scripted moments (spawn minions, change attack pattern, taunt sound).

---

## 1. The Mothership (grudge match)

The carrier from round 8, but now shootable.

- **Concept**: it hovers at the top and slowly sweeps left and right. The glowing
  bay on its underside is the only vulnerable spot; the hull still pings.
- **Attacks**:
  - Phase 1: opens the bay and releases `Jagged` in bursts of 4.
  - Phase 2: rim lights become turrets, firing small `EnemyBullet`s in a
    downward fan.
  - Phase 3: drops a `Cross` pair from each end and sweeps faster.
- **Weak point**: `contains()` is true only inside the bay rectangle, and only
  while `state === 'release'`. Otherwise `hit()` is just the clang.
- **Reuses**: `Mothership`, `Jagged`, `Cross`, `EnemyBullet`.
- **Effort**: S. Mostly new state-machine states in `mothership.js`.
- **Risk**: released minions hidden under the hull (already noted for round 8).

## 2. The Big Ball (Mama Bomb)

A giant `Ball` that bounces around, splitting when hit.

- **Concept**: radius ~70, same elastic wall bounce as `Ball`. Each hit chips
  hp; every third hit it splits off a normal-sized `Ball` that carries one of the
  chord notes.
- **Attacks**: it lays a `Bomb` on every wall bounce (not just ball collisions),
  and the bombs scale with the boss radius, so they get dangerous fast.
- **Phase 3**: the boss shrinks as hp falls and speeds up. Its note pitch rises
  with each phase.
- **Reuses**: `Ball`, `Bomb`, `sfx.note()`.
- **Effort**: S. `BossBall extends Ball` with a bigger `radius`; `Bomb` already
  takes a parent radius.
- **Risk**: a 70px ball plus 4x-radius bombs fills the screen. Cap the bomb
  parent radius or the explode factor.

## 3. The Pipe Organ

Three or four `Pipe`s joined at a hub, spinning like a pinwheel.

- **Concept**: a rotating cluster; each pipe's ends can be shot off independently,
  exactly like round 4. Boss dies when every end on every pipe is gone, plus the
  hub takes N hits.
- **Attacks**: `BigBullet`s from live ends (they already bounce and can be shot
  down). As pipes lose ends, the survivors fire faster and the hub spin
  accelerates.
- **Reuses**: `Pipe`'s end-damage logic, `BigBullet`. Rotation math moves from a
  single pipe to a parent transform.
- **Effort**: M. The refactor is turning `Pipe` into something that can be
  positioned relative to a parent (`local()` and `endTip()` need an origin and
  angle offset).
- **Risk**: hit-testing several rotated rectangles is fiddly; test with the
  headless sim approach used so far.

## 4. The Ceiling (Acid Mother)

A big blob that clings to the top edge and rains acid.

- **Concept**: occupies the top ~80px, drawn as a lumpy wobbling strip (similar
  to the jagged circle trick, radius re-rolled per draw). Weak point is a glowing
  core that slides left and right inside it.
- **Attacks**: spawns many `Acid` drops at once at its core's x (gathering
  faster in later phases); in phase 3 it pulls all drops toward the player's x
  while they hang, so they fall right on the ship.
- **Reuses**: `Acid` (give it a `fillTime` override), `TimedRound`-style spawning.
- **Effort**: S-M. The core hit-test is the only new geometry.
- **Risk**: drops fall at ~15 px/tick; the player needs tells (drop wobble is
  already there) and a safe lane.

## 5. The Tank Commander

A big tank on the middle line with a main gun and two cannon arms.

- **Concept**: 3x the size of a `Tank`, rolling on the same horizontal line.
  Main turret tracks the player and lobs `Shell`s; two side `Cannon`-style
  mounts fire spread `Cannonball`s.
- **Attacks**: phase 2 stops rolling and rains `Cannonball`s to every landing x
  (the cannon aim formula already handles this). Phase 3 spawns `Chaser`s from the
  hatch.
- **Reuses**: `Tank`, `Cannon`, `Cannonball`, `Chaser`.
- **Effort**: M. Mostly composition: a boss that owns child "mount" objects
  with offsets.
- **Risk**: three overlapping hit regions; treat the mounts as separate
  enemies sharing a common hp pool via the boss.

## 6. The Queen (chaser hive)

A slow, heavily armored hive that births `Chaser`s.

- **Concept**: big wedge-shaped (or hexagon) craft that drifts like a `Chaser`
  but with huge damping. It can only be hurt from behind (the opposite side from
  its heading), so the player has to get around it.
- **Attacks**: every few seconds it ejects a `Chaser` at 1.5x speed. Out of
  chasers on screen, it charges (thrust cap raised 3x for a second).
- **Reuses**: `Chaser`, `Bird`-style bouncing for the nose angle.
- **Effort**: S. Hit regions are a rotated half-plane check like `Pipe.local()`.
- **Risk**: nothing for the player to do except dodge unless the rear weak spot is
  clearly marked; give it a pulsing red patch.

---

## Quick comparison

| Boss | Effort | New geometry | Hardest part |
|------|--------|--------------|--------------|
| Mothership | S | bay rect | phase scripting |
| Big Ball | S | none | bomb scaling |
| Pipe Organ | M | rotated parent transform | multi-pipe hit-test |
| Acid Ceiling | S-M | wobbling strip | fair drop patterns |
| Tank Commander | M | child mounts | shared hp pool |
| Queen | S | rear half-plane | readability |

## Suggestion

Start with **Big Ball** or **Mothership**. Both are mostly flags and numbers on
existing classes, and either one would shake out the shared `Boss` scaffolding
(health bar, phases, death sequence) before committing to the bigger
composition bosses.
