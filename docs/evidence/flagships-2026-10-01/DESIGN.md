# Three signature shells: research and implementation contract

Research completed before implementation, 1 October 2026. Baseline: clean `b064fe43c87b9315afa91dda18364b88e70ee830`, moon/water candidate PR #25, build 2026-10-01.1. Its hosted fingerprint is `2e9aff20f01bdcbd7c57663d19c442b43b1eb305498795906f39b96048aaafc9`. The ten existing IDs, art, seeded recipes and moon/water architecture remain intact. Production is outside this release scope.

## References and visual territory

- [HEX professional effect vocabulary](https://www.hexfireworks.co.uk/blogs/news/firework-jargon-explained): Kamuro and crown finales, long-lived gold trails, contrasting pistils, travelling ghost-shell colour changes, crossette splits, glitter and palm fronds. Inspiration concerns appearance and timing, not manufacture.
- [Rise fireworks types and photographs](https://rise-hanabi.jp/fireworks/list/): inspected the chrysanthemum, double-pistil, thick palm and small-shell bouquet photographs. Nested depth, irregular thick fronds and separated secondary blossoms provide useful structural references. Downloaded reference images are local research only; no third-party photograph enters the application or release assets.
- [FWsim shell taxonomy](https://www.fwsim.com/doc/how_fireworks_work.html): brocade, slow horsetail, crossette and multi-break visual sequencing. Professional displays usually use mortar-launched aerial shells; Firecrackers intentionally retains its established rocket interaction and powered-rise/coast solver.
- [Nihonbashi Marutamaya](https://www.marutamaya.jp/en/?anim=no): artistic choreography and trajectories as composition. This informs pacing rather than copying a particular display.

The baseline Willow is one gold sphere; Aurora Crown is a jade dome/violet interior; Dahlia is twelve radial petals; Saturn is one fixed tilted ring; Phoenix Palm is an eleven-arm upward fan; Supernova is seven travelling jewel blossoms. New territory: nested ceremonial crown breaks and terminal glitter, a propagating colour wave with depth-separated curved petals and dispersed comet breaks, and an asymmetric bilateral sweep with sequential tip breaks and a closing diadem. These are authored virtual interpretations, not claims of exact reproduction of a real product.

## Explicit designs (times relative to first burst)

| Property | Imperial Crown | Celestial Aurora | Royal Phoenix |
|---|---|---|---|
| Rocket | Broad champagne paper, antique-gold cap/bands; tallest ceremonial profile | Slender midnight-blue paper, ice cap/silver bands | Broad oxblood paper, copper cap/gold bands |
| Ignition / ascent | Warm-white motor; thicker gold ember tail; powered fraction .28 | Ice-blue motor; thin silver comet; powered fraction .22 | Hot amber motor; bold copper trail; powered fraction .31 |
| Acceleration / apex | Analytic powered rise then coast; zero-speed apex from screen composition, no camera tracking; admission snapshots profile | Same solver with distinct thrust/coast ratio | Same solver with strongest short powered impulse |
| Smoke / pre-break | Existing bounded turbulent smoke; tapering warm bead approaching apex | Bounded cool smoke, receding blue bead | Bounded warm smoke, white-gold pre-break bead |
| Primary | Volume-distributed champagne brocade, two radial ranks and restrained ruby pistil; long descending arcs | Three depth-separated petal orbits and smaller violet sphere; icy core | Unequal left/right feather-comet ranks, no spherical envelope; crimson inner embers |
| Secondary | .95s eleven crown bundles opening inside main canopy | 1.3–2.1s eight dispersed small comet/crossette flowers | 1.2–2.3s six wing-tip clusters with unequal delays/depth |
| Tertiary | 2.5s smaller warm-white diadem; delayed terminal sparkle in crown heads | 3.15s narrow silver/emerald inner flower, restrained shimmer | 3.8s compact white-gold closing core with gold fallout |
| Size / velocities | .10–.20 world-unit heads; primary 26–35 units/s, crown 24–30; depth approximately .8 of sphere | .12–.22; petal radial 25–32, depth 10–22, children 9–14; phase-jittered directional ranks | .13–.25; outward 24–37, upward 9–26, depth ±12; sparse thick branches |
| Gravity / drag | Gravity 2.5–3.3, drag .40–.55, long 2–3s trails | Gravity 2.0–3.1, drag .42–.65, .6–1.3s trails | Gravity 3.0–4.1, drag .37–.62, 1.8–2.4s trails |
| Colour / luminance | Champagne → amber; ruby only interior; terminal warm-white glints | Midnight blue → cyan → violet → restrained emerald in a radial phase wave | Crimson → copper → antique gold; local final white-gold diadem |
| Sparkle / curvature | Independent slow tip shimmer; no full-scene flash | Gentle bounded transverse acceleration; independent slow shimmer | Mild organic branch curvature; sparse gold terminal glitter |
| Parallax / water | Actual 3D z ranks; shared mirrored particle pass and low-quality streaks | Same reflection path follows changing star colours | Same path follows moving wings and timed tip breaks |
| Approximate duration | 9s stars + residual trails, excluding fuse/flight | 7.5s plus trails | 8s plus trails |
| Sound | Existing fuse/lift/report/crackle hooks; distinct stages emit attenuated, spatial reports, no volume increase | Same; separated child reports | Same; asymmetric reports then softer closing report |

## Composition, admission and performance

- Keep fixed 60Hz simulation, independent seeded random streams, dense pooled arrays and existing buffers/passes. New recipes allocate only at discrete breaks. Per-star colour/gain/phase/curvature state uses fixed typed arrays; no new per-frame objects or RNG. Existing capacities remain 3072 heads, 24000 trails, 96 smoke, 768 embers.
- Conservative reservations cover all unborn children at Ultra before admission. Children are nonrecursive. Signature shells cost three admission units; Calm excludes composite signatures. Future reservations remain protected across settings changes. No surprise launch queue.
- Each primary break records a signature stage ordinal for deterministic QA. Quality retains the existing saved Low/Standard/Ultra vocabulary. Standard covers the requested Medium/High middle tier; inventing a fourth saved tier would change the approved preference model. Counts scale .6/1/1.2, structural ranks and break timings survive every tier.
- Composition scale is committed at admission along with apex: constrain principal structures to usable upper sky and horizontal distance from the selected launch position. Terrace placement remains exact. Sky drops use their selected point and a bounded, point-specific composition scale. Resize affects future profiles; airborne profiles remain immutable.
- Phone tray: Classics five, Grand five, Signature three in three centred rows, 48px targets and 32px artwork. Wider layouts use three separated groups where they fit, with an intermediate two-row layout. No scrolling, hidden effects or smaller essential targets. Shared measured tray geometry controls camera/panels/rail.
- GPU and Canvas share all trajectories, stages, colour evolution and gain. WebGPU/WebGL retain current TSL batches and depth buckets. Canvas keeps its existing sampled trails and cached quantized glow palette; no additional render pass. Low retains existing inexpensive reflection streaks.
- Reduced motion removes added transverse acceleration and shimmer. Reduced flashes suppresses modulation and limits local break energy. Settings and OS policy both apply, including changes while a shell is active. Primary identities and later breaks remain visible.

## Verification contract

Unit checks: append-only IDs/keys, finite deterministic recipes, nonrecursive stage reservations, three stages, quality/comfort identity, pause/reset/cleanup, mixed-show zero head drops, committed profile immutability. Browser checks: actual native WebGPU, forced WebGL and Canvas; tap/sky drag/terrace drag/cancel, all thirteen reachable, seven required viewports, principal screen bounds, stage timing, panels/pause/recovery/offline and no runtime errors. Matched baseline/candidate Willow captures preserve moon/water provenance; each new signature gets phone/desktop representative fixed-seed captures. Performance compares fixed-state baseline Willow and candidate Willow, then reports signature costs separately, with CPU/rAF evidence distinguished from GPU timing and physical devices.
