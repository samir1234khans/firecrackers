# Legacy launch and burst realism — 4 October 2026

## Source and release boundary

Started from freshly fetched main `729c766e5c240c3792f97b0dee99a89d869bc59e`, on `feat/legacy-fireworks-depth-realism`. Current candidate configuration is `2026-10-04.1`. Promotion is pending exact-head CI and final visual review; this document is not a promotion or deployment receipt.

The supplied handover was read completely. Its PR #33/#47 hold snapshot predates the owner-authorized reconciliation already on main: PR #47 merged as `e60d46443836d1f60bfb65f026dfc36eb5ba509c`, incorporating PR #33. That integration and its production `.4` remain preserved. No merge, revert or release action on those PRs is part of this phase. No Cloudflare deployment is authorized by this handover; production remains `2026-10-03.4`.

## Flight and composition

The first ten used a common .24 powered fraction, stayed close to z=0, and enlarged the luminous marker as the paper body disappeared. Their new immutable admission profiles use distinct powered proportions (.21–.31), a solved coast with the existing virtual gravity, and bounded negative burst depths (-48 to -78 authored world units). A smoothstep recession has zero depth velocity at both endpoints. Shell, motor, burst and report share the existing attachment transform and fixed simulation clock; no camera zoom or tracking was added.

The luminous shell contracts from 2.2 to .704 authored units while the physical body fades. Fine star cores, short birth staggering and independent extinction variation replace identical instant brightness. Counts, budgets, child reservations, UI and show cadence are retained. There is no new animation loop or particle pool.

The composition solver projects complete near/far envelopes through each backend's camera, including parent momentum, secondary travel and falling tails. It balances the opening above the shore with the complete unobstructed scene for cooling residue, following the existing signature presentation. It does not fit only the first frame. Terrace endpoints move the aim inward without changing effect scale. Exact perspective constraints include the off-centre centre magnification. Sky drops use the same depth and fitting model. Profiles are cached and warmed on resize/preparation, not rebuilt per rendered frame or during a launch.

An initial conservative rectangular fit made the prototypes too small. Visual review rejected it. The replacement distinguishes the opening from the full falling envelope and balances the centre per family. A later review found Finale carriers crowded together; the authored lateral travel was widened while preserving count and finite timing. These iterations and initial test failures remain in the local test-results records.

## Family treatments

| Family | Preserved identity and refinement |
|---|---|
| Gold Willow | Gold coast, rounded volume, finer separated strands, varied cooling and long falling residue. |
| Multicolor Peony | Jewel sectors and inner pistil, a rounded volume, .40-second cleaner trails, one opening without recursive breaks. |
| Chrysanthemum | Copper filaments, length/drag variation and stronger ruby terminal colour with existing detached embers. |
| Silver Crossette Crackle | Silver leader, parents travel before staggered 1.05–1.65-second splits, four momentum-preserving leaves with longer life. |
| Grand Finale | Full primary shell followed by five reserved moving breaks, alternating depth lanes and widened lateral separation, golden final residue. |
| Aurora Crown | Jade lift gives way to violet coast; jade upper dome and delayed violet heart retain mint/lilac cooling. |
| Ruby Dahlia | Twelve ruby/rose petals on distinct coherent depth planes, modest petal opening offsets and a delayed champagne centre. |
| Sapphire Saturn | Silver/gold lift to blue-white coast; fine sapphire sphere and a separate tilted gold ring with perspective, no orbit animation. |
| Phoenix Palm | Eleven rising amber branches with restrained coherent bending, varied lengths and scaled five-leaf tip breaks; no signature wings. |
| Opal Supernova | Primary opening, seven distinct moving jewel carriers and staggered nonrecursive blossoms. Child travel, gravity and envelope scale together. |

## Rendering, atmosphere and versioning

Six existing depth batches now span the farther legacy particles and nearer signatures instead of concentrating receded stars into an endpoint bucket. Core/halo size, trail width and extinction remain depth aware. Existing aerial transmission now also applies to trails, detached embers and smoke; Canvas smoke scale follows its own perspective. No bloom/exposure increase, additional fullscreen pass or remote asset is introduced.

The existing V4 lights, planar water mirror, boat/shore wash, smoke relighting and sound geometry read actual world positions. Sound reports therefore receive the new distance, delay, attenuation and pan without louder defaults or autoplay sound. The three signature recipes and authored launch proportions remain unchanged; small shared atmospheric/rendering corrections apply to all families.

Changing flight/recipe semantics bumps CONFIG_VERSION. Existing version checks keep older saved nights historical and require the established explicit Adapt a copy flow. No silent recipe conversion or new preference schema was introduced. Release generation automatically fingerprints the new client module.

## Evidence and qualification

Baseline: original main CI artifact/build `2026-10-03.4`, source/artwork fingerprint `04e7c05185f679e2d43923f5bcee5425d35856f2e1f51529e468819a64c9fcfb`. All 13 effects × four viewports × WebGL/Canvas × five phases were captured with seed 20261004, Ultra, reduced flashes on, reduced motion off, sound off. This is 104 cases / 520 baseline captures. Fixed-clock phase captures and condensed sequences are not frame-rate measurements.

Final matching uses a common 120-second fixed-clock scene origin before each launch; moving sequences step in exact six-frame intervals. An intermediate local all-view run was interrupted by a served-build replacement and is excluded from final qualification. Final captures use immutable build directories or the downloaded exact-head CI artifact.

Local implementation checks include all-tier continuous recession, immutable admission, complete cleanup/reservations, same-seed replay, both terrace endpoints, projected envelopes and complete simulated head trajectories through both cameras in seven viewport sizes (320×480, 375×667, 393×851, 768×1024, 844×390, 1280×800, 1920×1080). Full unit/build/CI results and final release fingerprint will be recorded after exact-head qualification. The CI runtime workflow adds the all-thirteen visual matrix, separating desktop motion into six family/backend chunks and the three smaller viewports into their own jobs. This retains all 104 cases / 520 phase captures and both desktop moving sequences while keeping software rendering within the job budget. The earlier unsharded desktop run was superseded before completion and is not counted as a pass.

A two-hour accelerated logical Standard soak completed 2,160 launches / 3,525 bursts: peak 1,464 heads, 20,000 trails, 64 smoke puffs, nine cues and six rockets. These are logical capacity checks, not physical endurance or GPU timing. Low portrait captures cover all ten in both backends. Installed Chrome accepted a non-fallback native WebGPU adapter for the three prototypes and three signature references.

Manual Chrome inspection confirmed native scene startup, reachable collection and pause control. Rendering pressure during concurrent local jobs invoked the existing truthful Low-detail recovery; this is not an isolated performance result. Hardware timing, Android/iPhone/Safari and sustained thermal performance remain unqualified. No GPU timing claim is made.

Initial test assertions requiring coarse Peony cores, every Crossette split by 1.5 seconds, and Saturn's earlier unexpanded world velocity were replaced by the intended fine-core, staggered-parent and normalized expansion contracts. Count, branch separation, ring tilt, reservation and cleanup assertions remain. A temporary fitting-test stub omitted modelScale and was repaired; a new native browser label assertion was corrected after identifying a test harness error, not a renderer fallback.

Runtime CI run 37160828844 retained two failing regression contracts: the stage test assumed every legacy apex was .30–.38 of the entire scene; the mobile launch test assumed every classic burst occurred within 3.8 seconds. Depth-aware per-family fitting and solved ascent invalidate those constants. The stage test now checks that the projected recessed apex agrees with the immutable fitted centre within one pixel, remains in the upper .68 of the actual sky and has a bounded positive scale. Complete opening and falling envelopes remain covered by the trajectory tests and all-thirteen browser matrix. The mobile test uses remaining committed fuse plus solved ascent, then verifies an actual burst. Both focused suites passed locally against the immutable final build. An initial strict boundary comparison at exactly .68 was corrected to allow one projection pixel, rather than altering the composition.

## Reproduction

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:soak
# Serve an immutable copy of the build, then set LEGACY_URL to that origin.
LEGACY_VALIDATE=1 LEGACY_VIDEO=1 npm run test:legacy-realism -- test-results/legacy-realism
```

`LEGACY_VIEW`, `LEGACY_BACKENDS`, `LEGACY_FAMILIES` and `LEGACY_QUALITY` allow focused reviews. `LEGACY_HARDWARE=1` selects installed Chrome and asserts that a requested WebGPU adapter is non-fallback. Software CI remains labelled separately.
