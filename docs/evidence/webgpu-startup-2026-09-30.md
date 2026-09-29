# WebGPU repair and graphics roadmap — 30 September 2026

## Reproduced causes and repair

Installed Chrome on the owner's PC reproduced two application defects on build 2026-09-29.6:

1. Smoke used 10–11 vertex buffer streams, exceeding the WebGPU device's default limit of eight. Particle instance attributes now share one interleaved buffer.
2. Activating authored paper replaced a 512×1024 texture with a 256×512 image after GPU allocation. Chrome threw `copyExternalImageToTexture: Copy rect is out of bounds of external image`. The new image is drawn into the existing canvas allocation.

The recovery message previously mislabeled the second exception as failed authored graphics. Actual exceptions are now logged. Runtime WebGPU failure or sustained overload attempts WebGL before Canvas, retaining the simulation and selected quality. Settings identifies the active renderer and provides explicit WebGPU/WebGL links; recovery offers retry without lowering quality.

## Candidate evidence

Build: 2026-09-30.1. Source/asset fingerprint: `1e9598a54640f443c26d2846f43467ccfdce8a99bafdb98662049cb2c71bbd51` (50 entries).

Local checks: lint, 128 unit tests, build, 34 stage checks, independent asset suite, five overload checks, and six opt-in hardware WebGPU checks passed. Hardware checks captured all six assets active, a real-time Willow launch, deterministic Willow/Saturn/Supernova renders and cleanup, and an injected WebGPU-to-WebGL recovery preserving Ultra and the committed rocket. No captured application or GPU validation errors.

[Local hardware report](webgpu-startup-2026-09-30/local-report.json) and [actual Saturn capture](webgpu-startup-2026-09-30/Sapphire-Saturn.png).

Installed Chrome selected Intel gen-12lp, with `isFallbackAdapter=false`. This is hardware WebGPU evidence on this PC, not NVIDIA qualification. Chrome warned that WebGPU powerPreference is ignored on Windows. No system GPU settings were changed. These tests do not establish 15-minute thermal performance or physical phone performance. QA time stepping is used for the three repeatable composition captures; the initial Willow launch runs in real time.

## Recommended stack and next increments

Keep TypeScript for deterministic simulation, scheduling and interaction; Three.js 0.180.0 for the scene; TSL for shared GPU materials; native HTML/CSS/React for controls outside the frame loop; Blender for original editable geometry and baked material/smoke assets. Keep versions pinned during this repair. Three.js documents WebGPURenderer's WebGPU path and WebGL 2 fallback: [official guide](https://threejs.org/manual/pages/webgpurenderer), [renderer reference](https://threejs.org/docs/pages/WebGPURenderer.html).

WebGPU is an execution backend, not an automatic realism upgrade. Matched shaders, assets and quality should look similar across WebGPU and WebGL. The best efficiency choice must be measured on the target device.

1. **Measure before adding load.** Compare WebGPU and WebGL at identical seed, viewport, resolution and Ultra settings. Record p50/p95 frame times, CPU/GPU cost where available, draw calls, memory, smoke overdraw and reflection cost. Qualify a 15-minute Festival run on this PC and physical Android/iPhone separately. Retain saved quality.
2. **TSL rendering refinement.** Improve continuous trail taper, age-dependent color and smoke lighting. Prototype half-resolution smoke/bloom and bounded reflection updates; accept only when same-seed captures preserve silhouettes, color and reflection timing while measured frame cost improves. Keep transparent output and reduced flashes correct.
3. **Blender asset refinement.** Produce richer smoke flipbooks, paper/foil roughness and terrace contact detail from editable masters. Pilot renders first, then optimize GLB and shared texture sizes. Preserve lossless density/data atlases; evaluate compressed color/normal textures separately. Validate in both browser backends, including missing-asset fallback.
4. **Compute only when profiling justifies it.** Prototype GPU particle simulation behind an optional WebGPU path if CPU simulation/upload becomes dominant. Preserve deterministic recipes, bounded admission and WebGL functionality; do not rewrite the full engine or change language to chase assumed speed.

Acceptance for each increment: paired captures of Willow/Saturn/Supernova plus all-ten functional checks, no new GPU errors, bounded resource cleanup, offline/recovery checks, and measured device results. Neither generated concepts nor Blender renders count as browser performance evidence.
`n## Hosted preview`n`nPreview Worker c5bbca9d-a269-4b1d-baf1-ac1230babc1d serves the matching fingerprint at https://firecrackers-graphics-preview.allygym-api.workers.dev/. All six hardware checks passed with zero errors; see [preview report](webgpu-startup-2026-09-30/preview-report.json).
