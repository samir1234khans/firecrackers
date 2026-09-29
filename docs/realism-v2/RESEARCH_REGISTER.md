# Research and open-source register

Access/review date: 16 September 2026. This is a targeted primary-source review for the Firecrackers upgrade, not an exhaustive survey of every effects engine. Upstream pages can change; implementation must pin the exact package/tag/commit it adopts.

## Interpretation rules

A source can demonstrate that an API, technique or component exists. It cannot establish that it has been integrated, benchmarked, visually approved or licensed for every third-party asset in this project. All project-specific architecture, priorities, budgets and acceptance criteria are proposed engineering/design decisions unless explicitly identified as existing-source findings.

Code licenses and media licenses are separate. Preserve required upstream notices for copied/adapted code. Verify each downloaded asset. No new runtime dependencies, source copies, asset downloads, purchases or application-license assignment were performed for this research package.

## R01 — Firecrackers source and evidence

Repository: https://github.com/samir1234khans/firecrackers

Audited commit: https://github.com/samir1234khans/firecrackers/tree/5aafb8033fbfb231518efbb73d1fa2141ff53977

Key files: `package.json`; `src/engine/Renderer.ts`; `src/engine/Simulation.ts`; `src/engine/useWorld.ts`; `src/App.tsx`; `src/platform/usePlatform.ts`; `docs/06-art-direction-and-realism.md`; `docs/evidence/runtime-implementation.md`.

Verified observations include orthographic projection, instanced quads, disabled particle depth tests, direct scene render, eased ascent, 2D local-light distance, screen-plane crossette children and scheduled finale offsets. The existing evidence record distinguishes CPU simulation/billboard smoke from GPU compute/full volumetrics. These findings justify an incremental renderer and lifecycle upgrade rather than a new app scaffold.

Branches were refetched. `feat/fireworks-v1-implementation` and `feat/fireworks-v1` diverge from the same documentation baseline. Preserve both until their differences are reviewed. Branch names do not determine authority.

## R02 — Three.js WebGPURenderer

https://threejs.org/manual/en/webgpurenderer

https://threejs.org/docs/pages/WebGPURenderer.html

The official guide documents WebGPU with WebGL 2 fallback, explicit `forceWebGL` testing and the node/TSL material boundary. It does not make legacy GLSL material hooks interchangeable with the new renderer. Adopt the existing architecture; require a backend compatibility experiment before adding an external rendering plugin.

Core Three.js license: MIT. Retain the installed package's notice. No dependency upgrade is implied.

## R03 — Exact r180 native bloom example

https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/webgpu_postprocessing_bloom.html

https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/jsm/tsl/display/BloomNode.js

The r180 example uses `THREE.PostProcessing`, `pass` from `three/tsl`, and `bloom` from `three/addons/tsl/display/BloomNode.js`. This is the appropriate first reference for the installed 0.180.0 API. Reuse the library module and integration pattern, not the example's model or aggressive demonstration settings. The example has separately attributed media; its code license does not erase those asset terms.

## R04 — Current native post-processing guide

https://threejs.org/manual/en/webgpu-postprocessing.html

The current guide uses `THREE.RenderPipeline` and describes node composition, output conversion and MRT. This is useful architectural guidance but not permission to mix current names with r180 code. Pin the chosen release. Verify transparency and attachment cost rather than adding MRT for every optional effect.

## R05 — Three.js color management

https://threejs.org/manual/en/color-management.html

Primary guidance for linear working color, texture color-space assignments and output conversion. Use it to review the entire scene/post-processing path. Internal floating-point targets are a separate decision from browser/display HDR output. Density/normal atlases need data semantics, not color-image conversion.

## R06 — three.quarks

https://github.com/Alchemist0823/three.quarks

https://docs.quarks.art/docs/core-components/renderers

https://docs.quarks.art/docs/core-components/behaviors

https://raw.githubusercontent.com/Alchemist0823/three.quarks/master/LICENSE

MIT-licensed particle/VFX project. Useful references include `TrailBatch`, batched render modes, width/color-over-life, texture animation, force behavior and sub-emitters. Its README lists WebGPU rendering as roadmap work and describes experimental node/WebGPU-compute work separately. Therefore the plan does not certify the main renderer as compatible with this app's TSL pipeline.

Decision: inspect/adapt a small compatible algorithm or use it in an isolated benchmark; do not replace the authoritative simulation without evidence. Copying source requires its notice and a record of the upstream revision. The separately linked older editor repository identifies itself as archived; do not assume it is a maintained production authoring dependency.

## R07 — EffekseerForWeb, the newer runtime

https://github.com/effekseer/EffekseerForWeb

https://github.com/effekseer/EffekseerForWeb/blob/main/README.md

https://raw.githubusercontent.com/effekseer/EffekseerForWeb/main/LICENSE

The new JS/WASM runtime documents WebGL and WebGPU, plus a minimal Three.js WebGPU integration example and application-owned render-pass support. The runtime license is MIT. This updates the common assumption based only on the older WebGL integration.

Decision: optional bounded experiment for one authored micro-effect. Prove exact Three.js version interoperability, device/context ownership, depth/HDR/alpha integration, resource disposal, pause/seed behavior and payload size before adopting it. Documentation is not a production-maturity or performance guarantee. Sample effect/media rights still need their own check.

## R08 — Effekseer authoring and older WebGL integration

https://effekseer.github.io/en/

https://github.com/effekseer/EffekseerForWebGL

The official project supports visual effects authoring and export. The older WebGL repository's integration uses a Three.js WebGL context and points readers to the newer dual-backend runtime. Do not mix those two integrations or describe the whole ecosystem as WebGL-only. Authoring can be useful even when the new runtime is not selected for production.

## R09 — Blender smoke workflow and artwork licensing

https://docs.blender.org/manual/en/4.0/physics/fluid/introduction.html

https://www.blender.org/about/license/

The versioned manual documents a smoke domain, emitter/flow, materials and cache-bake workflow. It is a stable workflow reference, not a claim about the current Blender UI layout. Blender's own license page distinguishes GPL software from original artwork produced with it.

Decision: author and bake original smoke and rocket/material assets offline. Ship optimized output assets, not Blender or a fluid solver. A third-party model used in a Blender scene retains its own rights; exporting it does not remove restrictions.

## R10 — glTF Transform

https://gltf-transform.dev/

https://github.com/donmccurdy/glTF-Transform/blob/main/LICENSE.md

MIT-licensed optimization tooling. The official documentation covers mesh optimization/compression and texture resizing/compression, including KTX2/Basis workflows. Use as a pinned build-time pipeline after real assets exist. Compare normals, transparency, silhouettes and decode cost before accepting smaller files.

## R11 — Three.js KTX2Loader

https://threejs.org/docs/pages/KTX2Loader.html

The loader documents KTX2/Basis transcoding and capability detection. Use the implementation matching the selected Three.js release. Record the actual transcode target and fallback behavior on each renderer/device. Compressed transfer size, decoded memory and GPU texture memory are different quantities.

## R12 — Poly Haven asset license

https://polyhaven.com/license

The site's asset license is CC0 for its HDRIs, textures and models. The license page distinguishes those assets from protected site copy, logos and preview/user images, and publishes separate service/API terms. Select eligible assets through permitted access; do not scrape the site or treat every page image as a production asset.

Decision: candidate source for material/environment ingredients. No particular asset has been selected or downloaded in this research.

## R13 — ambientCG

https://ambientcg.com/index.php

The official library identifies its materials, models and HDRIs as CC0 assets. Candidate source for restrained surface ingredients. Confirm the individual asset page and preserve metadata when selecting a download. No specific asset or final material set has been approved here.

## R14 — NVIDIA: High-Speed, Off-Screen Particles

https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-23-high-speed-screen-particles

Explains the fill-rate/overdraw problem and a reduced-resolution particle-target approach with depth downsampling and compositing. It also discusses quality artifacts. Use the technique concept for smoke resolution experiments; do not copy legacy API code directly or assume a speedup before profiling the browser implementation.

## R15 — Curl-noise for procedural fluid flow

https://doi.org/10.1145/1276377.1276435

Bridson, Houriham and Nordenstam, ACM Transactions on Graphics, 2007. Primary research on controllable procedural turbulent velocity fields. Useful for a low-cost coherent wind/turbulence model. It is not a requirement to implement a full fluid solver, and the paper's availability is not a license to redistribute every associated asset or implementation.

## R16 — WCAG flash criterion

https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold

https://www.w3.org/TR/WCAG22/

The W3C guidance defines flash frequency/area/contrast considerations and explains why a pause control does not undo a dangerous flash. Apply review to whole rendered sequences, including overlap, normal settings and output size. The plan's comfort controls and proposed numeric limits are not certification.

## R17 — Web Audio activation and positional sound

https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices

https://developer.mozilla.org/en-US/docs/Web/API/PannerNode

Primary platform guidance on audio loading/activation, user control and positional sound. Use a bounded shared audio engine with semantic events and explicit cancellation. Position/attenuation and modeled propagation delay are separate responsibilities. No production recordings were selected or auditioned during this research.

## R18 — OBS Browser Source

https://obsproject.com/kb/browser-source

Official documentation of CEF-based browser sources, dimensions/FPS, default transparent CSS, hidden-source shutdown and activation refresh options. These explain why stream integration requires a separate test matrix. CSS transparency alone does not establish correct WebGL/WebGPU render-target alpha or bloom composition.

## R19 — Spector.js

https://github.com/BabylonJS/Spector.js/

https://github.com/BabylonJS/Spector.js/blob/master/package.json

MIT-licensed WebGL debugging tool. Captures commands and graphics state. Use as a development aid for the forced-WebGL path. It is not presented as a WebGPU profiler, nor should a capture/debug extension be added to the public runtime automatically.

## R20 — WebGPU timing

https://webgpufundamentals.org/webgpu/lessons/webgpu-timing.html

The author-maintained technical guide explains CPU/GPU timing and optional timestamp-query capability. Feature-test rather than requiring optional timing support to run the app. Capture methodology and device context with results; do not compare unrelated sample timings to project targets.

## R21 — WebGPU samples

https://webgpu.github.io/webgpu-samples/samples/particles/

https://webgpu.github.io/webgpu-samples/samples/computeBoids/

Primary example implementations for compute-updated particle buffers and instanced rendering. Research reference for a later GPU experiment, not the selected V2 baseline. Verify the exact repository license/revision before copying code; no code from these examples was imported by this planning delivery. Their advertised particle counts are not Firecrackers benchmarks.

## R22 — Firework appearance terminology

https://fireworks.com/safety/fireworks-effects

The display vendor's own descriptions distinguish peony, willow, crossette and other visual effects. Used only for appearance vocabulary, not physical handling or manufacture. No product purchase, explosive material specification or real firing instructions are part of the application plan.

## R23 — Display-design appearance reference

https://alchemyweddingfireworks.co.uk/explore/learn-about-fireworks/52-firework-effects/

A display operator's descriptions of hanging effects, centers and patterns provide a second primary appearance reference. Actual reference footage still needs to be viewed and logged with timestamps before claiming measured timing or art fidelity. Do not reuse its media without permission.

## R24 — Effect distinctions

https://dynamicfireworks.co.uk/descriptions-firework-effects

Distinguishes crossette sub-effects, crackle and double-break terminology. Used to avoid conflating a visible split with a mandatory sound treatment. The app's Silver Crossette Crackle and Grand Finale are authored combinations, not claims that all physical products have those behaviors.

## R25 — pmndrs postprocessing

https://github.com/pmndrs/postprocessing

The library's examples use WebGLRenderer. It is not the selected post-processing path for this TSL/WebGPURenderer application. Evaluate any future integration against exact versions and supported APIs; do not assume compatibility from the shared Three.js name.

## Reuse gate before implementation

For every adopted dependency or source adaptation: identify the exact problem it replaces; pin version/commit; preserve the license text; verify media rights separately; inspect dependency and payload cost; pass the two-backend experiment where relevant; demonstrate lifecycle cleanup and bounded resources; record the integration decision and rollback. Prefer a small reusable piece over importing an entire second architecture.
