# Runtime implementation and evidence

Date: 16 September 2026. Owner-authorized scope: implement the previously documented Firecrackers web application while preserving the repository and syncing work to GitHub.

## Source and deployment

Branch: `feat/fireworks-v1`, created from main commit `7603a2c63ef1f4e36e4c1d845915632640d83369`. Main and all original documentation were preserved. No force update was used.

- `7e5d11c929a0dbfd4a21c709af19379c3af036b8`: engine, tests, toolchain and PWA scaffold.
- `a8ac72cb7785dcb36cb314aae48c497f709bcc0d`: renderer, audio, platform services, complete React UI, browser tests and CI.
- `1b03b8d574987f27b49d812681ed678babf43f11`: actual resolved dependency lock, saved by CI.
- `f5a4a3edf381165def201554c6cb06d52e3f1b31`: haptic cancellation guard, explicit audit gate and expanded screenshots/tests.
- The hardening commit containing this document pins patched build dependencies and adds generated library notices. Its resulting SHA is obtained from Git history rather than self-invented.

Isolated preview: https://firecrackers-a93nle.v2.appdeploy.ai/ . AppDeploy app `firecrackers-a93nle`, source snapshot `1789540825714`, reported ready. No runtime errors were reported by the host at that check; no separate host QA result was supplied. GitHub is the authoritative application source. The preview uses the equivalent runtime files inside AppDeploy's React/Vite scaffold, platform formatting, generated icon snapshots and five host QA workflow definitions; it is not claimed to be a byte-identical GitHub artifact or a permanent production deployment.

## Implemented architecture

React owns menus and low-rate presentation state. `Simulation.ts` runs a bounded 60 Hz fixed-step state machine outside React. The accumulator clamps large gaps rather than fast-forwarding fireworks after suspension. Separate seeded streams support repeatable effect/director scenarios.

`Pool.ts` is structure-of-arrays storage: 3,072 heads, 24,000 trail samples, and 160 smoke layers. Quality presets impose smaller admission/emission budgets. Shows and secondary cues have finite lifetimes; overload rejects immediately rather than scheduling an unexpected future launch.

`Renderer.ts` uses Three.js 0.180.0 WebGPURenderer/TSL with its WebGL 2 fallback and an explicit `?backend=webgl` diagnostic override. GPU-instanced quads render sparks, trails and smoke. The simulation is CPU-based; this is not GPU-compute physics. The camera uses a stable orthographic composition with 3D launch props and projected 3D burst velocities. Smoke is layered billboard density with local light envelopes, not true volumetric fluid rendering. The glow is an additive radial kernel, not a postprocessing HDR bloom pass. These choices preserve a feasible browser baseline while leaving visual refinement open.

`Audio.ts` synthesizes original fuse, launch, boom, echo and crackle layers, stereo-panned by position with delayed distant bursts. There are no externally hosted sound files. A compressor and bounded voices limit overlap; mute/pause cancels scheduled voices and haptic timers. Sound starts off and is activated only by a user control.

`usePlatform.ts` handles PWA registration/update prompts, install events, fullscreen and wake locks with explicit fallback feedback. `preferences.ts` validates versioned localStorage data. Storage failure does not block the scene. `App.tsx`, `Dialog.tsx` and scoped CSS implement the responsive glass interface and accessible alternatives.

The runtime catalog is `src/engine/catalog.ts` with CONFIG_VERSION `2026-09-16.1`. Original `specs/*.json` remain the design baseline, not measured performance data. Numeric budgets/visual units were adapted for this implementation; changes do not silently replace an effect family.

## Actual verification

### Engine and boundedness

18 Node tests passed: catalog identities; hold commitment and early release; complete lifecycle for each family; pause/resume; manual priority; capacity rejection; finite Finale; deterministic streams; reset; non-finite inputs; pool compaction.

Accelerated logical soaks each simulated 7,200 seconds:

| Quality | Launches | Bursts | Peak heads | Peak trails | Peak smoke | Peak rockets | Peak secondary cues |
|---|---:|---:|---:|---:|---:|---:|---:|
| Low | 1,107 | 1,107 | 246 | 7,365 | 48 | 3 | 0 |
| Standard | 1,744 | 1,780 | 834 | 18,349 | 100 | 6 | 5 |

These prove logical resource caps for the exercised seeds, not rendering FPS, device thermals or a two-hour real-time screen session.

### GitHub browser/build evidence

[Run 35062832838](https://github.com/samir1234khans/firecrackers/actions/runs/35062832838): dependency installation, typecheck, lint, 18 tests, Standard logical soak, production build, documentation validator and 10 browser cases passed. Artifact 10432922363 retains the build and report. Its fixed-delay screenshot sometimes captured ascent; this was corrected rather than interpreted as proof of a burst.

[Run 35063650709](https://github.com/samir1234khans/firecrackers/actions/runs/35063650709): the verify job passed all checks and the expanded 12 browser cases. Artifact 10433531372 retains every family's rendered capture, landscape settings captures, report and build. The separate security-review job failed for the known build dependencies below; the workflow as a whole was therefore not fully green.

Browser environment: Playwright 1.55.1 Chromium in Ubuntu CI with SwiftShader WebGL 2; desktop 1280x800 and Pixel 7 mobile emulation 393x851. Landscape capture: 851x393. The tests do not represent physical Pixel, Samsung, iPad or Safari hardware. Browser binaries are installed through the pinned Playwright version; actual launch details are in each report/log rather than an assumed current browser version.

Browser scenarios verify deliberate lighting and displayed counters; sound activation/mute UI; early hold cancellation and keyboard ignition; five selections, directed show, manual takeover and reset; persisted comfort settings without autoplay; cold offline reload and another effect; all-five-family captures and landscape layout. Reviewed screenshots confirm distinguishable point, trail, split and layered burst forms and readable overlay controls. This is a visual inspection of the working candidate, not owner photorealism approval.

### Dependency findings and remediation

Actual audit artifact 10433815921 identified two high-severity direct build-tool findings: Vite 6.3.6 and PostCSS 8.5.6. The audit's suggested non-major patched versions are pinned: Vite 6.4.3 and PostCSS 8.5.28. CI resolves/preserves their actual transitive lock and reruns the audit. This document does not predeclare that future result.

Development and preview servers now bind to loopback. Deploy only the static build. An audit result describes a particular dependency graph/date, not a guarantee that vulnerabilities cannot exist.

## Requirement implementation / evidence matrix

| Requirement | Implementation and evidence boundary |
|---|---|
| FR-01 | Single responsive scene with overlays; desktop/mobile/landscape browser captures. |
| FR-02 | All five implemented and captured; independent effect topology in engine tests. |
| FR-03 | Drag plus slider and left/center/right controls; placement tested in browser. |
| FR-04 | 650 ms hold, cancel and Light once/keyboard; engine and browser tests. |
| FR-05 | Fuse/ascent/burst/sub-events/afterglow/cleanup; tests for every family. |
| FR-06 | Per-quality admission units and bounded pools; rejection/soak tests. |
| FR-07 | Gravity/drag/trails/shared smoke drift and local lighting implemented; ultimate realism approval open. |
| FR-08 | User-activated procedural audio, immediate stop and scheduled-voice cancellation; activation UI tested; listening review on phones open. |
| FR-09 | Capability-gated, opt-in short pulses with bounded timers; physical haptic testing open. |
| FR-10 | Three paced presets with bounded Finale and resource admission; tests. |
| FR-11 | Selection/placement/ignition stops new auto scheduling; tests. |
| FR-12 | Pause, reveal controls and audio cancellation implemented; basic pause tested, interruption matrix open. |
| FR-13 | Untimed/skippable intro, replay and success/skip persistence; browser flows. |
| FR-14 | Schema-validated, failure-tolerant preferences; persistence browser test. |
| FR-15 | Full runtime precache and generated install icons; cold offline Peony flow tested. Physical installation and all-family offline device matrix open. |
| FR-16 | Continuous Calm/Festival, idle-hide UI and optional wake lock; show tests, physical wake-lock testing open. |
| FR-17 | User-requested fullscreen with failure feedback; browser-specific physical verification open. |
| FR-18 | Hidden-page pause/no catch-up, graphics error and retry/lower-quality overlay; engine pause tested, browser interruption/context-loss matrix open. |
| FR-19 | Ignition gated on initialized renderer and resource admission; runtime initialization/capacity tests. |
| FR-20 | Confirm/cancel reset, resource release, preferences and onboarding reset; engine/browser tests. |
| NFR-01 | UNVERIFIED: physical frame-time targets, 30-minute device and two-hour real-time GPU/thermal session. |
| NFR-02 | Enforced pool/voice/timer/cue bounds; accelerated logical soak passed. |
| NFR-03 | WebGL 2 browser path passed. True hardware WebGPU parity remains UNVERIFIED. |
| NFR-04 | Named focusable controls, keyboard/one-click alternatives and modal focus; full accessibility/target-size audit open. |
| NFR-05 | Reduced-motion/flashes/pause/mute implemented. Flash-risk certification NOT performed. |
| NFR-06 | Frontend-only, no accounts/trackers/secrets/remote media. Hosting access logs disclosed. |
| NFR-07 | Seeded event scheduling/config version; deterministic engine tests. |
| NFR-08 | Prompt-based service-worker updates and cache versioning implemented; offline cold load passed, multi-version update/recovery matrix open. |
| NFR-09 | Original procedural assets and installed-license generator; inventory below. |
| NFR-10 | Source, runs, lock workflow, preview and explicit unrun gates recorded; never promote based on invented results. |

## Asset and reuse inventory

- Rocket geometry/materials: original procedural `makeRocket` implementation; no imported model.
- Rocket selection illustrations: original inline SVG `RocketIcon.tsx`.
- Background/horizon: original gradients and seeded canvas silhouettes; no photo/reference footage reused.
- Smoke: original seeded noise texture generated in memory; no remote image.
- Sparks/trails: original simulation and TSL radial kernels.
- All sound/ambience: original procedural Web Audio, generated noise buffer and oscillators; no extracted samples.
- App icon: original SVG and dependency-free PNG generator.
- UI icons: installed lucide-react package; upstream notice included by build generator.
- Fonts: device/system font stack; no font files copied, uploaded or distributed.
- Framework/renderer/PWA: installed React, React DOM, Three.js and Workbox. `scripts/generate-notices.mjs` copies their installed license text into the static build and fails if required text is absent. It does not assign a license to the owner's application.

## Continuation and release gates

Fetch latest refs and read the source/evidence before editing. Continue this feature PR rather than starting a competing long-lived branch. Keep all five families, cancellation/accessibility, no-autoplay and bounded-memory behavior. Run the exact checked-in build/test commands after changes. Do not replace the functioning implementation with a landing page, video loop, random unbounded particles or a different app scaffold.

Before production: verify current hardening CI, review visual/audio feel on actual owner devices, complete hardware WebGPU/WebGL and Safari/iOS tests, exercise context loss and service-worker upgrades, perform sustained performance/thermal and flash-risk/accessibility checks, then obtain brand/license/hosting choices at the release gate. Any additional realism work should be measured against actual captures rather than marketed as already completed.
