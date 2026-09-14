# 04 — The five fireworks

## Scope and terminology

These are **digital animation specifications**, not physical pyrotechnic designs. The selectable foreground objects are original stylized rocket-like props; their sky effects borrow display-family characteristics. No dimensions, compounds, real ignition procedures, or manufacturing data are required.

Industry descriptions distinguish peony's colored spherical break, chrysanthemum's visible trails, willow's long drooping trails, and crossette's splitting stars. Our artistic identities use that vocabulary, while the timing and budgets below are proposed software tuning values. Sources: [S04–S05](19-research-and-reuse.md).

## Shared timeline and coordinate conventions

One selection creates an unlit foreground prop. Hold-to-light uses a 650 ms default threshold, then a 1.5–2.5-second burning fuse. Each admitted launch samples a seed once. A small coherent deviation changes timing, orientation, radius, and decay inside the family's bounds; never randomize these values afresh each frame.

`burstY` is the center of the primary burst as a fraction of usable scene height measured from the **bottom**. It is not a real-world altitude. Burst radius is a fraction of the smaller viewport dimension. Total visual duration runs from liftoff to the last visible ember, excluding the fuse and persistent smoke. Fit the projected burst and its droop inside the scene using aspect-aware placement and depth; do not simply crop landscape trajectories on phones.

All per-family spark counts describe requested primary emitters at Standard quality, not total rendered spark fragments. The global resource manager may reduce subordinate trail fragments before changing the visible family structure.

## FX-01 — Gold Willow: the quality benchmark

**Identity:** warm gold, broad hanging canopy, long uneven downward strands, quiet dying glitter. The silhouette should remain legible after the explosive center has faded.

**Sequence:** textured fuse hiss; a warm lifting tail; 1.8–2.5 seconds of ascent; a compact white-gold ignition core; rapid outward expansion that decelerates; then 4.5–7.0 seconds of progressively dimmer falling trails. Primary center at burstY 0.65–0.77; radius 0.22–0.30. Request 140–220 primary emitters. Total visual duration about 7–10 seconds.

**Motion:** outward velocities vary within a controlled sphere and immediately inherit gravity and drag. Outer trajectories bend into a dome; some embers extinguish earlier. Avoid a perfect circular ring and avoid equal-length vertical noodles.

**Color/light:** hot near-white cores transition to gold and amber. Bloom reveals heads and bright segments without filling every gap. Smoke becomes warm at the burst and later catches other firework colors.

**Sound:** lift thrust, a round distant report, soft extended sizzle. A whistle is not mandatory for every launch.

**Standard fallback:** preserve at least 80 main canopy strands and their long decay; reduce strand sampling before removing the characteristic droop. Gate: compare the complete trajectory, not just the peak screenshot.

## FX-02 — Multicolor Peony: crisp colored sphere

**Identity:** dense, rounded points of color with short or nearly invisible trails. Use a coordinated two- or three-color palette per launch, not arbitrary rainbow pixels.

**Sequence:** 1.4–2.0-second ascent; one crisp burst; fast expansion and a relatively clean 1.5–2.5-second fade. Center burstY 0.60–0.74; radius 0.18–0.25. Request 180–280 primary stars; total visual duration about 3.5–5.5 seconds.

**Motion:** near-spherical distribution with a dense core-to-edge balance and slight irregularity. Adjacent stars may share a color cluster; depth and perspective should prevent a flat wheel appearance.

**Color/light:** proposed palette pairs include crimson/gold, green/silver, and violet/gold. Keep light energy bounded regardless of palette. Farther stars may be dimmer; do not apply equal glow to every point.

**Sound:** one concise report and a light residual sparkle rather than a long crackle bed.

**Fallback:** preserve the colored spherical silhouette and quick decay. Gate: it is distinguishable from Chrysanthemum even in grayscale because trails differ.

## FX-03 — Chrysanthemum: radiant traced sphere

**Identity:** a large round bloom whose stars leave readable radial spark trails. This is not Peony with a longer timer.

**Sequence:** 1.6–2.2-second ascent; one strong bloom; 2.8–4.3 seconds of radiating trails that gently fall. Center burstY 0.63–0.77; radius 0.21–0.29. Request 150–230 primary emitters; total visual duration about 5–7 seconds.

**Motion:** coherent spherical expansion with less canopy-like sag than Gold Willow. Trail density tapers from a bright moving head toward older segments. Modest color transition may occur near the tips, sampled once per emitter.

**Color/light:** gold with red tips or silver with amber tips, chosen by launch seed. A bright central event decays quickly so spokes remain visible.

**Sound:** a fuller report than Peony with moderate sparkling decay, not an exaggerated bass hit unrelated to the sky distance.

**Fallback:** keep the spoke structure; lower secondary spark density. Gate: the same trajectory history produces the trail, rather than a pre-drawn radial sprite.

## FX-04 — Silver Crossette Crackle: split, then glitter

**Identity:** a handful of bright silver comets visibly separate into four children, followed by restrained micro-crackle. The splitting event must be readable before the glitter.

**Sequence:** 1.5–2.1-second ascent; a first bloom of 20–32 parent comets; parents travel for 0.45–0.80 seconds and split exactly once into four child trajectories; sparse crackles follow after 0.20–0.65 seconds. Center burstY 0.61–0.75; radius 0.19–0.26. Total visual duration about 4.5–6.5 seconds.

**Motion:** each split uses an oriented local cross with bounded variation; children inherit parent velocity plus separation velocity. Different parents split at slightly different times. No recursive subdivision after the child generation.

**Color/light:** silver heads, warm dying sparks, individually timed flashes below the global flash-intensity envelope. Crackle is a separate visual/audio layer, not the crossette algorithm itself.

**Sound:** primary report, then a spatially coherent small set of snap clusters. A voice pool represents clusters; do not play a new audio buffer for every spark.

**Fallback:** reduce the parent count to 10–16 while retaining four children per parent. Suppress secondary glitter before removing splitting. Gate: a slow-motion developer recording clearly shows the parent-to-child handoff without teleportation.

## FX-05 — Grand Finale: one selected multibreak composition

**Identity:** a compact rising experience followed by staged groups of smaller blooms and a final golden curtain. This is the fifth selectable experience; the automatic Finale preset is a separate show-level concept.

**Sequence:** a longer 2.0–2.6-second ascent; one main split; three child-burst groups with offsets around 0, 0.65, and 1.30 seconds relative to the split; a Gold Willow-derived closing group around 2.20 seconds. The composition lasts approximately 9–13 seconds after liftoff. Center burstY 0.67–0.79; individual child radii 0.09–0.15, combined envelope no larger than 0.34 of the smaller viewport dimension.

**Composition:** the normal topology is two compact colored child bursts per group, followed by one gold closing group. At Low quality, use one child per group and retain the closing gold. Each child uses an existing family generator; do not implement a second independent particle engine.

**Admission:** reserve the complete scheduled peak cost before ignition. The composition counts as three launch-cost units until its scheduled children finish. Lower tiers stagger children further rather than violating their pool caps. Saturation disables another launch with a brief understandable status; it does not cancel an already lit finale.

**Sound:** separated reports, controlled crescendo, then a fading glitter tail. The master limiter and accessibility envelope override artistic intensity. Do not implement a salute/strobe wall.

**Gate:** all staged groups remain legible, smoke is not a solid rectangle, and the closing curtain is visible at Low and Standard settings.

## Shared acceptance and tuning protocol

Use fixed scenario seeds and review at ignition, liftoff, pre-burst, first expansion, middle decay, and last ember. Compare side-by-side with legally viewed reference footage under similar framing; references are for observation, not extraction. Capture portrait and landscape at the same quality tier. Change one parameter family at a time, recording version and rationale. Once the hero is approved, preserve its behavior in regression recordings while expanding the catalog.
