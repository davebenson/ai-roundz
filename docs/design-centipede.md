# Design: Centipede round

A chain of segments that follows its head. Shooting a segment removes it; the
chain splits in two, and each half has its own head. The round ends when every
segment is dead.

Status: **design draft.** Proposed answers are marked *(proposed)*; the open
questions at the bottom are the ones that change the code.

## Player experience

- A long chain (12 segments) snakes onto the screen, weaving down toward the
  player. It is easy to read: head with eyes and mandibles, round body segments
  with little legs that wiggle.
- Shooting the head promotes the next segment to head (the chain just shortens).
  Shooting the middle splits it into two independent, faster chains. Shooting
  the tail trims it.
- Short chains move faster, and splitting makes more heads to track, so
  the round escalates on its own as the player does well.
- Touching any segment costs a life, like every other enemy.

## Core model

Segments are ordinary `Enemy` objects in `world.objects`, so hit-testing,
`world.enemies`, sound and the round-clear check all work unchanged. What is new
is the **chain**: a small plain object that segments share.

```
Chain { segments: [Segment...], trail: [{x, y}...], speed, heading }
```

- Only the **head** (`segments[0]`) steers. Each tick it advances along its
  heading and appends its new position to `chain.trail`.
- Every other segment is *placed* on the trail, not simulated:
  `segment i` sits at `trail[trail.length - 1 - i * LAG]`, where `LAG` is
  `ceil(SPACING / speed)` ticks. Because the head moves at constant speed,
  equal lag means equal spacing along the path.
- Followers' `move()` does nothing. The head's `move()` repositions all of
  them at the end of its own update, so one tick sees a consistent chain.
- Trail length is capped at `(segments.length + 1) * LAG`; older points are
  dropped from the front.

Following the same trail means the whole body automatically takes the head's
turns, wall bounces and weaving, with no per-segment steering code.

## Splitting

When segment `k` dies (`Segment.onDeath`, so any kill path works):

1. `k === 0` (head): the chain is the same, minus its head. Segment 1 becomes
   head. Its position is already on the trail, so nothing jumps.
2. `k === last` (tail): remove it. Trim the trail.
3. Otherwise: **cut the chain**.
   - Front chain: `segments[0..k-1]`, keeps the original head and trail.
   - Back chain: `segments[k+1..n-1]`, new `Chain` whose trail is the part of the
     old trail from segment `k+1`'s position backward (`slice` from the front
     of the array to index `len - 1 - (k+1) * LAG`, inclusive). Its first
     segment becomes the new head, with the current heading, so it carries on
     straight and only diverges as it begins steering.
   - Each chain's `speed` is recomputed from its length.

Because the back chain inherits the trail it was already walking, there is no
teleporting and no gap.

## Head movement

*(proposed: sweeping rows, like the arcade game)*

- Heading is mostly horizontal. At a side wall the head turns downward for one
  row height (~`SPACING * 1.2`), then continues in the other direction.
- At the bottom it climbs back up to the middle band, so it stays in play
  without ever being parked on the player.
- A small sinusoidal weave on the vertical axis gives the body a visible wave.
- Speed starts at about 2.0 px/tick for a 12-segment chain and scales as
  `base * (1 + (12 - length) * 0.08)`, so a lone segment is about 1.9x faster.

*Alternative*: free-form wandering that curves toward the player (see "Open
questions").

## Segment and head

- `Segment extends Enemy`: circle hit-test and player-overlap (`radius` ~12),
  `hit()` = die in one shot. Constructor takes the chain and its index.
- Head draws bigger (radius ~15) with two eyes and a pair of mandibles that
  point along the heading; body segments draw as a circle with two legs whose
  angle is `sin(age * 0.3 + i)` for a rippling walk.
- Colors: body segments blend along the chain (head red, tail green) so a split
  chain is easy to read.
- Heads fire rarely *(proposed: no shooting in v1)*; add later by overriding
  `fire()` on the head only.

## Spawning

`Round.spawnWave` builds enemies one at a time with `new type(x, y, ...)`, which
doesn't fit "create N linked segments". *(proposed)*: add an optional static
hook, `type.spawnGroup(world, wave, fireChance)`, that `spawnWave` calls
instead when present. `Centipede.spawnGroup` creates one chain of `wave.length`
segments off-screen at the top-left (or right), with the head already pointing
into the screen and the trail pre-filled in a straight line behind it so the
segments just walk on.

A wave is then `{ type: Centipede, length: 12, speed: 1 }`. The round has 3
waves with 12, 16 and 20 segments.

## Sound

- Segment death: `sfx.pop()`.
- Split: a short bright `tone` plus noise click.
- Head death: `sfx.explosion()`.
- Optional: each segment index has a note from the chord table (`BALL_NOTES`),
  so a chain dying from the head sounds like a descending arpeggio.

## Edge cases to handle

- Head and follower dying in the same frame (bullet hits one, the other is
  killed by `playerHit`): `onDeath` must tolerate a segment that is no longer
  in its chain.
- `world.playerHit()` kills every enemy: let the chain objects be garbage
  collected and rebuild on round restart (`Round.reset` already does that).
- `lag * speed` rounding: store `LAG` per chain so changing the speed doesn't
  stretch the body. When speed changes after a split, rebuild positions from
  distance traveled, not ticks.
- Chains that walk into each other: no collision between chains *(proposed)*;
  they pass through.

## Testing plan (headless, as with earlier rounds)

1. Segments stay evenly spaced (distance between consecutive segments within
   10% of `SPACING`) while the head bounces off walls.
2. Killing segment `k` of an `n`-long chain yields chains of lengths `k` and
   `n - k - 1`, and the new head position equals the old segment position.
3. After a split, no segment's per-tick movement exceeds `speed * 1.5` (no
   teleporting).
4. Round ends exactly when every segment is dead; all three waves complete.
5. Player contact with any segment (including mid-chain after a split) costs a
   life.

## Open questions

1. **Movement**: *sweeping rows* (classic, readable, easy to tune), or
   *free-form wandering toward the player* (more organic, harder to predict)?
2. **Shooting**: do heads shoot (small `EnemyBullet`s along the heading), or is the
   chain itself the only danger?
3. **Leftovers**: classic Centipede leaves a mushroom where a segment dies. Do
   we want something similar (a short-lived `Bomb`, a spore that blocks
   bullets) or keep it clean?
4. **Segment toughness**: all one hit *(proposed)*, or armored segments that
   take 2 hits for later waves?
5. **Scale**: lengths 12/16/20 over 3 waves, or one long chain that has to be
   chopped up?
