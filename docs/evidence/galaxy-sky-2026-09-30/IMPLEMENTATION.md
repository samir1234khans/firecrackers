# Original celestial waterfront sky

Candidate build: `2026-09-30.3`. Recorded: 30 September 2026. Branch: `feat/galaxy-night-sky`.

## Implemented composition

The sky adds fine seeded cool and warm stars, rare restrained cross glints, and a gently curved celestial dust filament above the existing dark waterfront. The burst canopy remains dark enough for fireworks to lead the composition. The selected direction uses the owner's OpenAI pages as visual references; the application contains original generated celestial artwork rather than their images or an undocumented proprietary renderer. [Research and inspected source licenses](RESEARCH.md) distinguish the references from implemented code.

`GalaxySky.ts` generates two original 1024 × 512 cached canvases once per renderer: stars and dust. The existing 2048 × 1024 sky texture receives the star layer, including after the authored waterfront image activates. One additional GPU texture samples the dust through the existing Three.js/TSL sky material. Canvas compatibility draws the cached canvases with bounded transforms. There are no additional particle streams, per-frame noise generation, animation loops or scene draw calls for the celestial layer.

The sky retains the seven independent authored-asset states and procedural fallback. Transparent presentation excludes the sky. Texture/canvas resources are released on renderer disposal.

## Clock, comfort and resource bounds

The shared simulation clock supplies celestial movement; there is no separate wall clock or animation scheduler. The dust angle is `sin(sim.time × 0.022) × 0.010` radians. Its small translation follows `sin(sim.time × 0.018) × 0.005` horizontally and `(cos(sim.time × 0.018) − 1) × 0.003` vertically in sky UV space. These are slow bounded changes rather than camera motion.

Low quality, the operating system's reduced-motion preference, and the app's reduced-motion class use a static sky transform. Reduced flashes lowers celestial intensity. Existing pause/background/idle render ownership remains authoritative: paused scenes and an empty observatory do not acquire a new continuously running sky renderer.

The two cached RGBA canvases occupy approximately **4 MiB of CPU pixel storage**. The additional RGBA dust texture occupies approximately **2.67 MiB including mipmaps**, estimated from dimensions and format; this is not a measured total GPU-memory result. The production pipeline adds no downloaded sky asset for this procedural layer. An art-production pilot reported **86 ms** to generate the artwork on this PC; that one-time pilot is not a frame-rate, thermal or physical-device qualification.

## Local browser evidence

[`local-report.json`](local-report.json) records **21 passing checks**, zero application/GPU validation errors, and five sequential browser contexts. `tests/galaxy-browser.mjs` uses installed headed Chrome without software GPU flags for its hardware projects.

| Project | Viewport | Actual renderer | Hardware | Authored assets |
| --- | --- | --- | --- | --- |
| Desktop | 1280 × 800 | WebGPU | Intel `gen-12lp`, fallback adapter `false` | Seven active |
| Desktop | 1280 × 800 | WebGL 2 | ANGLE, Intel UHD Graphics 770, Direct3D 11 | Seven active |
| Portrait | 393 × 851 | WebGPU | Intel `gen-12lp`, fallback adapter `false` | Seven active |
| Portrait | 393 × 851 | WebGL 2 | ANGLE, Intel UHD Graphics 770, Direct3D 11 | Seven active |
| Portrait | 393 × 851 | Canvas 2D compatibility | GPU-independent drawing | Procedural scene |

The four hardware projects retain default Ultra and enabled reduced flashes, and capture Gold Willow and Sapphire Saturn without renderer demotion. During a manually paused visible burst, world time, particles and renderer frame counts remain exactly unchanged. After 40 seconds of deterministic cleanup, all active rockets, visible particles, smoke and child carriers reach zero. Empty-scene observation adds only 1, 0, 0 and 0 settling frames respectively across the four projects.

Saved Standard quality and reduced flashes survive a reload. An explicitly aborted waterfront image produces a recorded sky diagnostic while the procedural/celestial fallback still launches and bursts in WebGL. The OS reduced-motion preference initializes the existing comfort control. Canvas remains playable; five sampled sky locations have zero alpha in transparent presentation. These checks do not claim that every output pixel was exhaustively inspected.

## Captures and source identity

The saved captures use seed **20260916**, device scale factor **1**, and independent simulation reset. Idle is captured at world time zero. Saturn's peak is captured at a nominal **4.9 seconds after the ready launch press**, using deterministic 60 Hz simulation steps. The full report preserves actual snapshots and exact release metadata.

| Actual WebGPU scene | Desktop | Portrait |
| --- | --- | --- |
| Idle sky | [1280 × 800](captures/desktop-webgpu-idle.png) | [393 × 851](captures/portrait-webgpu-idle.png) |
| Sapphire Saturn | [1280 × 800](captures/desktop-webgpu-saturn-peak.png) | [393 × 851](captures/portrait-webgpu-saturn-peak.png) |

All four local hardware projects served the same **54-entry source/asset fingerprint**:

`4dbd35d5c1dbdb2a182d6012d8b7c46db5630fc1abfa34cde820d5e53a822bd3`

The local screenshots establish browser appearance on this PC. Portrait is viewport/touch emulation, not a physical Android or iPhone. The suite does not measure completed GPU-frame timing, sustained Festival throughput, temperature or photographic parity.

## Hosted preview and rollback boundary

[Isolated sky preview](https://firecrackers-sky-preview.allygym-api.workers.dev/) was published as Worker version `2cb43d82-6daf-4dd9-a645-b226bfeecdad`, with the same candidate fingerprint above. The final [hosted report](hosted-report.json) records **21 passing checks**, zero application/GPU validation errors, all seven authored assets active in desktop/portrait hardware WebGPU and WebGL, and the same release fingerprint in all four hardware projects. Their idle frame deltas are all zero, with loaded fonts, visible pages and unchanged viewport/control bounds. Canvas, saved preference, missing-sky and transparent-presentation checks also pass.

The hosted qualification history is retained:

- [First attempt](hosted-attempt-1-report.json): nine checks passed, then Chrome closed the page/context/browser before portrait startup completed. No application/GPU validation error was recorded.
- [Second attempt](hosted-attempt-2-report.json): the empty-sky render-count assertion failed after the WebGPU pause check. This earlier harness did not yet record the before/after viewport and visibility state needed to determine the cause.
- [Diagnostic retry](hosted-diagnostic-report.json): unchanged render-count threshold, 21 checks passed, zero application/GPU errors, and all four hardware idle frame deltas were zero. Each observation retained Ready phase, no active rockets/particles/child carriers, and the requested renderer.

The final harness waits for `document.fonts.ready` and six consecutive unchanged viewport/control-bound measurements before its idle sampling interval. It also records before/after visibility, layout and full scene snapshots. The allowed idle delta remains at most two settling frames; it was not increased. Runtime source remained unchanged during this diagnosis. These records do not establish a confirmed cause for the earlier intermittent failure.

The production baseline before this sky release is cinematic build `2026-09-30.2`, Worker version `2bd3e2bd-c4bb-418b-9ca6-ce11ebef9d5a`; retain that version as the rollback reference. Preview publication does not by itself establish production promotion or public verification. The coordinating release record provides the exact main commit, CI outcome and applied production Worker.
