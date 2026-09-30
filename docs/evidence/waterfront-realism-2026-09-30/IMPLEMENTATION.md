# Waterfront v008 implementation

Build `2026-09-30.7` was based on clean canonical main `eebcf8a75b308b1d6d69630f5ae0579d7f735a77`. The [production receipt](PRODUCTION.md) records its verified promotion through PR #23.

## Scene changes

- Original Blender v008 terrace: 47 editable stone pieces, recessed joints, worn coping and eight shared material variants. Replaces the rectangular board with a quay extending beyond the screen edges; portrait depth extends through the bottom of the frame.
- Boat asset retains the verified CC0 weathered canoe hull and original woven shelter, two seated silhouettes, landing details, varied homes and sparse trees. Three boats share six maps; movement, candles and wakes follow the existing simulation clock.
- The former far village was almost entirely erased by scene fog. Its replacement sits at the actual far-water edge, with a local restrained haze treatment; boats retain their normal atmospheric fog.
- Three dark contact footprints and eighteen subdued ripple fragments are one bounded instanced draw. No new particle pool or recurring geometry allocation. Existing ten practical lamps, four candles and single bounded point light remain.
- Crossing water normals and subdued sky highlights add structure between bursts. Firework reflection caps remain 512px/30Hz Ultra and 256px/15Hz Standard; Low retains event-driven streaks.
- Cool sky lighting, reduced warm key intensity, darker steel launch base and eight practical fasteners replace excess decorative metal rings.
- Canvas keeps its inexpensive procedural scenery, with reduced near-boat scale and simple hull contact/ripples. It does not load or claim the full Blender geometry.

## Browser-driven corrections

The first actual Chrome pilot showed that moving homes nearer made them appear to float in front of the far bank. The village was moved back to the measured water edge, with its own haze treatment. The first terrace pilot showed exaggerated cloudy highlights; the authored maps were refined. A later pilot exposed an albedo color-space conversion error (linear .053 saved as encoded .053), which was corrected at asset generation. A new screen-bound assertion exposed the terrace ending before the bottom of portrait viewports; its depth was corrected while holding the water-facing edge fixed. Unsuccessful pilot reports are retained with the final evidence.

## Asset boundaries

[River provenance and reproduction](../../../assets-source/blender/RIVER-V008.md), [terrace source and verification](../../../assets-source/blender/terrace-v008/README.md), and [global provenance](../../../assets-source/PROVENANCE.md) preserve original/licensed ownership. Old exports and editable masters remain available. Source masters, render studies and caches are excluded from the public asset bundle.

## Qualification

`tests/waterfront-composition-browser.mjs` runs installed Chrome without software-GPU overrides. It asserts actual backends, nonfallback WebGPU, hardware ANGLE WebGL, exact served fingerprint, house attachment to the waterline, readable projected village size, full-width foreground coverage and bounded boat details. It produces same-seed idle/Saturn captures at desktop, tablet and phone sizes. Existing tests cover Grand/original effects, recovery, missing/decode-failed assets, texture disposal, UI controls and pause/comfort behavior.

Passing emulation or deterministic captures does not establish physical-phone endurance, Safari parity, completed GPU-frame timing or photographic realism. Those remain distinct from implementation and observed browser appearance.
