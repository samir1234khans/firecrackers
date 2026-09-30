# Galaxy night sky: reference and source research

Research date: 30 September 2026. Working branch: `feat/galaxy-night-sky`.

This document records visual references, inspected public source code and the bounded engineering direction. It is research evidence; implementation, browser appearance and performance remain subject to the coordinating agent's design and release checks.

## Confirmed visual references

The owner identified these pages after the initial research. The following observations were made by the coordinating agent in a live browser and relayed to the research agent:

- [Introducing GPT-6 Sol and Luna](https://openai.com/index/introducing-gpt-6-sol-and-luna/): a dark navy field with fine white, cool and warm stars, plus a few small cross-shaped glints. The inspected hero did not expose a DOM canvas; the image description identified dark navy artwork. That observation does not establish an undocumented rendering engine or access to its original source.
- [Introducing GPT-6.1 Sol](https://openai.com/index/introducing-gpt-6-1-sol/): a large golden central orb, a dense curving band of star dust, and smaller cool and warm points.

For Firecrackers, carry forward the fine star scale, color restraint and smoothly curved dust distribution. Preserve the dark waterfront and clear burst canopy. The large central orb would obscure the fireworks, so it is not part of the intended scene. These pages are visual references; no OpenAI image, animation, branding or unpublished implementation is to be copied into the bundle.

## Primary open-source references

The code and license pages below were opened during this research. Compatibility claims are scoped to the inspected source, not a new browser qualification.

| Source | Verified license | Reusable idea | Compatibility and cost |
| --- | --- | --- | --- |
| [Three.js r180 TSL galaxy example](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_tsl_galaxy.html) | [MIT, Three.js authors](https://github.com/mrdoob/three.js/blob/r180/LICENSE) | Radial distribution, branch angles, angular variation, small sprite cores, and warm/cool color interpolation | Uses `SpriteNodeMaterial`, TSL and `InstancedMesh` at the application's pinned revision. Its 20,000-sprite rotating demonstration is an algorithm reference, not the proposed Firecrackers workload. |
| [Kingsley's Milky Way shader reference](https://github.com/CK42BB/procedural-stars-threejs/blob/main/celestial-shaders.md) | [MIT, Copyright 2026 Kingsley](https://github.com/CK42BB/procedural-stars-threejs/blob/main/LICENSE) | Tilted band envelope, multi-scale noise, dark dust-lane subtraction and gentle color variation | The inspected Milky Way fragment code is GLSL. It requires a TypeScript bake or a TSL translation rather than direct insertion into WebGPU materials. Its volumetric nebula and compute sections are not needed for this scene. |
| [Gustavson and McEwan's periodic flow noise](https://github.com/stegu/psrdnoise/blob/main/src/psrdnoise2.glsl) | MIT notice in source; GLSL copyright 2021 Stefan Gustavson and Ian McEwan | Smooth periodic noise and analytic derivatives, useful for curved dust structure and a gentle flow field | A [WGSL port](https://github.com/stegu/psrdnoise/blob/main/src/psrdnoise2.wgsl) is supplied with its own MIT notice, but the author reports limited testing. Any port or adaptation must be checked on the actual pinned rendering path. Bake or cache the flow field to avoid repeated full-screen derivative work. |

The periodic noise source provides a noise gradient. A two-dimensional flow field can be formed by rotating that gradient, then tracing short seeded paths through it. This is a proposed adaptation for curved dust paths, not a claim that the reference pages use curl noise. A simpler bounded orbital-arc distribution, informed by the pinned Three.js example, may achieve the desired composition with less implementation and verification cost.

Two additional checks informed the choice:

- [Three.js r180 SkyMesh](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/objects/SkyMesh.js) is MIT and uses the node material path. Its analytical atmosphere is useful for horizon and extinction calibration; it does not itself supply the detailed galaxy artwork.
- [`@pmndrs/sky`](https://github.com/pmndrs/sky) currently documents a Three.js minimum of 0.185. Adding it to the pinned 0.180 application would require a separate dependency migration and is not proposed for this change.

## Selected engineering direction

Use original seeded sky content and cached textures, integrated with the existing renderer clock. Do not introduce an additional `requestAnimationFrame` loop. Motion, if included after visual review, advances only while the scene is active; pause, background suspension and the existing inexpensive idle behavior remain authoritative.

The coordinating agent will decide exact composition, texture resolution, star count and motion amplitude after reviewing the implementation. Initial design bounds are:

1. Keep most stars tiny and faint, with occasional warm and cool accents. Sparse glints must remain smaller and dimmer than firework heads.
2. Build a smooth curved dust band using bounded orbital arcs or cached noise-guided paths. Avoid a broad bright nebula behind the main burst structure.
3. Generate lower-resolution dust/flow data once and upscale it into the sky texture. Reuse allocations and avoid full-resolution per-frame fBm, raymarching or unbounded particle creation.
4. Fade dust and stars toward the horizon and under the authored cloud band. Keep the center visually quiet enough for all ten firework identities to remain legible.
5. Drive any subtle motion from shared simulation time. Disable animated glints or drifting layers when the appropriate comfort preference requires it. Never add automatic camera rotation, tracking or shake.
6. Use the existing sky and reflection contracts. Preserve transparent presentation output and independent missing-asset recovery.

Caching can reduce recurring shader and CPU work, but its actual benefit depends on texture size, upload timing and composition. No frame-rate improvement, phone qualification or GPU endurance result is established by this research.

## Licensing and review gates

Retain the exact applicable copyright and MIT notices if source is copied or substantially adapted. Record which source informed each implemented algorithm and distinguish original code from ported code. A repository's open-source code license does not license unrelated promotional artwork.

Before release, inspect desktop and portrait sky composition both idle and during matched seeded fireworks. Exercise actual hardware WebGPU, forced WebGL and Canvas. Confirm pause/background behavior, reduced motion/flashes, offline loading, missing-asset recovery and resource cleanup. Record source fingerprint, backend, viewport and logical time for comparisons. Physical-phone and thermal evidence remain separate from browser emulation.
