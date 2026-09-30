# Fine stars and flowing stardust — implementation plan

## Direction

Use the owner's two supplied OpenAI pages as visual references: a deep navy field of fine stars and sparse soft glints, plus smooth curved cool/warm stardust. Keep the original waterfront horizon, clouds and authored launch terrace. The native fireworks remain the brightest, most active scene content and the middle stays open for effects.

Implement original code informed by the pinned Three.js MIT galaxy example. The reference page's artwork is not being copied or shipped. [Source research and licensing](RESEARCH.md) distinguish visual observation from source availability.

## Bounded implementation

1. Build a seeded cached star field with restrained warm/cool color, small soft cores, occasional glints and irregular low-opacity haze. Composite into the existing fixed-size sky canvas for authored and fallback scenery.
2. Generate one bounded transparent stardust atlas with curved orbital filaments, variable density and dark gaps. Evaluate texture construction once. Use one extra sampler on the existing sky surface; add no sky mesh draw call, compute pass, raymarch or particle pool.
3. Advance extremely slow coherent texture drift from `Simulation.time`. The shared clock freezes on pause; the existing scheduler stops drawing an idle scene. Add no independent requestAnimationFrame or wall-clock motion. Low quality can keep the layer static and dimmer.
4. Fade dust toward clouds/horizon and reduce its intensity around the main burst canopy. Keep radiance below bloom threshold and lower its contrast under reduced flashes. Preserve the sky's measured waterline and portrait crop.
5. Reuse the cached art in Canvas at reduced intensity. Exclude it from transparent output; preserve independent missing-sky fallback, fixed texture allocations and explicit disposal.

## Review and release

- Inspect actual desktop/portrait idle and active scenes against both references. Check fine stars, soft halos, curved dust, horizon seams and absence of central glare.
- Verify actual hardware WebGPU and forced WebGL compilation, Canvas, missing authored sky, pause ownership, stable idle frame counts and transparent output.
- Record texture sizes, construction/submission timing and asset/source fingerprint. These do not qualify physical-phone endurance.
- Run existing full release CI and publish an isolated sky preview. Promote through clean main to the authorized Cloudflare domain after passing gates; retain the previous cinematic Worker for rollback.

## Deliverables

The native sky code, reference/source research, same-seed browser captures, focused motion/idle checks, hosted preview, full CI and a production/rollback receipt. This iteration adds no firework type, UI panel, remote asset dependency or replacement renderer.
