# Moonlit water — implementation review guide

The waterfront now combines displaced swells, layered surface normals, a camera-derived moon highlight, source-aligned planar reflections and sampled hull contact. The existing main-view boats, village, terrace, camera, controls and thirteen firework identities remain the application baseline. This document describes the code and resource contract; [PREVIEW.md](PREVIEW.md) owns exact source, deployment, CI, measured outcomes and remaining release gates. [PLAN.md](PLAN.md) records the accepted direction.

## Shared surface and lighting

[Simulation](../../../src/engine/Simulation.ts) integrates wind into `waterPhase` on the existing fixed step, using the previous/current wind average. Changing wind does not multiply elapsed time by a new speed. Pause stops phase advancement; the existing hidden-page lifecycle retains explicit resume ownership.

[WaterWaves](../../../src/graphics/WaterWaves.ts) supplies a caller-owned `WaterFrame` and allocation-free `sampleWater`. Four directional waves have artistic wavelengths of 180, 100, 60 and 40 world units, with a summed absolute displacement bound of **0.51 units**. CPU samples and shader displacement use the same height field and analytic slopes, including derivatives of the shoreline attenuation. Both flatten at the far bank and the actual coping edge, `z=-14.75`; desktop and portrait far boundaries are `-1000` and `-180`.

[WaterReflection](../../../src/graphics/WaterReflection.ts) adds independently moving broad, middle and fine normal scales from the existing licensed/original asset path. Fine detail fades with distance. Fresnel starts at **0.02**; low-frequency reflected sky illumination reveals swell faces while retaining dark troughs. The moon direction comes from the existing moon's screen composition unprojected through the camera. Rough and narrow specular lobes break its path into irregular wave facets without drawing another moon disc.

The four strongest live burst-light anchors provide a bounded world-space illumination response with the source hue and lifetime. This matters when the mathematically correct reflected burst lies behind the quay: that image is not relocated into visible water. Reduced flashes limits reflected/incident burst energy independently of the wave-motion setting.

## Aligned reflection with bounded work

[PlanarReflection](../../../src/graphics/PlanarReflection.ts) mirrors the camera around mean water height **4.65**, preserves the source camera and constructs an oblique clip plane using the correct WebGL `[-w,w]` or WebGPU `[0,w]` depth interval. A projective texture matrix aligns reflection sampling with world coordinates. Shared surface slopes distort and soften the sampled image.

The projection is cropped to the visible water band with 0.012 normalized padding. The target keeps the full-view horizontal sampling density while allocating only those water-band rows. Resize and boundary changes invalidate its schedule; the reflection pass otherwise follows simulation time rather than an independent animation loop.

Homogeneous mirror coordinates are calculated in the vertex shader and divided by `w` in the fragment shader. A reusable combined camera projection/view matrix replaces two transforms for reflected sky directions. Portrait layouts use 15 Hz on Ultra and 10 Hz on Standard; desktop retains 30/15 Hz. These rates stay within the approved ceilings and preserve target resolution, wave motion and per-frame moon/burst shading. Explicit asset activation and comfort-pose changes refresh a paused target once, then return to the fixed-clock throttle.

- Layer 3 contains four lightweight scenery-proxy draws; layer 4 contains existing firework head/trail batches. Water, screen-composed sky, smoke, terrace, launch props, contact overlays and UI are excluded.
- [RiverLife](../../../src/graphics/RiverLife.ts) retains the full authored PBR scenery in the main view. Reflection-only Basic-material instances have fixed capacities of **3 hulls, 3 shelters, 12 homes and 10 lamps**, with no reflected PBR-map sampling. Hulls copy the actual buoyant poses; the covered nauka retains its shelter silhouette. Houses use local bounds from the pinned export's twelve wall groups and their actual child matrix; lamps use the moving practical anchors. Procedural fallback supplies nine homes and its three cabin/shelter silhouettes.
- [ParticleReflectionBounds](../../../src/graphics/ParticleReflectionBounds.ts) accumulates conservative billboard/segment bounds while the existing particle stream is written. [ParticleScene](../../../src/graphics/ParticleScene.ts) rejects head/trail batches outside the cropped reflection frustum; there are **12 possible batches**. Empty startup batches remain visible to warm their reflection variants.
- Preparation compiles the reflection variants before launches. `finally` restores the render target, MRT, clear state, viewport, scissor and camera-dependent particle orientation/protection/visibility, including failed passes. Geometry, materials, vectors, instance buffers and uniform slots are preallocated and disposed with the renderer.

| Tier | Surface treatment | Planar allocation and schedule |
| --- | --- | --- |
| Ultra | Four geometric waves; three normal scales | One cropped target; maximum edge 512 px; maximum 30 updates per simulation second |
| Standard | Two long geometric waves; two normal scales | One cropped target; maximum edge 256 px; maximum 15 updates per simulation second |
| Low | Static surface detail and moon response; bounded light fragments | No target; retained fallback streak capacity 288 |
| Canvas | Shared CPU phase/sampling and bounded perspective fragments | No GPU reflection pass or target |

## Hull contact, coping and compatibility

Each boat samples bow, stern, port and starboard. Mean height supplies heave; yaw-correct longitudinal/transverse height differences supply pitch and roll. Spatial averaging and restrained angular response keep the covered boat steadier without reducing its heave. The existing **21 contact instances** provide three narrow dark footprints and eighteen interrupted side wavelets. All contacts and up to **80 practical-lamp fragments** sample the displaced water height and tangent. Stationary boats receive small displacement disturbances rather than forward wakes.

[NightEnvironment](../../../src/graphics/NightEnvironment.ts) adds a narrow irregular damp band to the existing coping, with restrained reflected burst color. Legacy distant lamps belong to the shoreline group so authored sky activation does not leave an evenly spaced light row across open water.

[CompatibilityRenderer](../../../src/graphics/CompatibilityRenderer.ts) uses the same integrated phase and tier-resolved field through a perspective screen-to-water map. Its fixed drawing limits include twelve interrupted swell patches, 96 moon/ambient fragment pairs, up to 80 practical-lamp fragments and 21 hull-contact marks. Cached boat images produce short reflected-silhouette fragments. Burst reflections use a bounded reciprocal perspective approximation; Canvas does not claim the GPU renderer's physical mirror-camera parity. The damp seam retains the existing terrace composition.

Reduced motion selects a static shared wave pose. Low selects zero geometric waves. Pause holds boat/contact/fragment transforms, and transparent output removes the waterfront and releases its target. Missing normal art retains the existing playable texture fallback. No new asset download, backend, sound, preference panel or animation loop is introduced.

## Review and qualification boundaries

[Wave tests](../../../tests/moon-water.test.mjs) cover derivatives, bounds, shoreline attenuation, quality/static frames and continuous integrated phase. [Planar-camera tests](../../../tests/planar-reflection.test.mjs) cover both backend clip intervals, mirrored coordinates and cropped projection; [state tests](../../../tests/water-reflection-state.test.mjs) cover restoration and target lifecycle. [Native browser coverage](../../../tests/moonlit-water-browser.mjs) exercises seven viewports, each backend, shared phase/hulls, resource caps, pause/controlled visibility, comfort, transparency and missing art. QA exposes surface bounds/phase, hull samples, contact/reflection checksums, proxy counts/triangles and cropped/cull diagnostics.

[Matched captures](../../../tests/moonlit-water-capture.mjs) and [sequential performance pairs](../../../tests/moonlit-water-performance.mjs) remain evidence procedures, not automatic visual or hardware guarantees. Performance sampling observes the actual app loop after asset activation and warmup; rAF cadence, renderer CPU submission and QA-observer overhead are separated. The planned p95 regression allowance is the greater of 2 ms or 20% on matching hardware/workloads. Final pass/fail belongs in [PREVIEW.md](PREVIEW.md).

Phone-sized browser viewports are emulation on this PC. Physical phones, Safari, OS background endurance, completed GPU-frame timing and sustained thermal performance remain separate qualification requirements. Three.js r180 WaterMesh/ReflectorNode adaptations retain source attribution and MIT text through the existing [notice generator](../../../scripts/generate-notices.mjs); [asset provenance](../../../assets-source/PROVENANCE.md) remains intact.
