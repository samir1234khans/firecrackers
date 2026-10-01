# Moonlit water and immersive shows — production release

The owner authorized finishing the implementation, reconciling branches, main promotion and production deployment. Build **2026-10-01.11** is live at [Firecrackers](https://firecrackers.mainandmany.com/). All thirteen effects and the scene composition remain preserved.

## Source and deployment

- Runtime main: `dd625594b3d051defe34a76807d69234d20ce695`, merged through [PR #31](https://github.com/samir1234khans/firecrackers/pull/31).
- Cloudflare Worker: `a2230baf-84c8-42c8-96b8-ceeff3ece962`, confirmed at 100% traffic.
- 83-module normalized source/art/audio fingerprint: `b7687fa6f916f5b3dd391d17d9646888314001a728296313961275001f7b3d45`.
- Isolated [preview](https://firecrackers-moonlit-preview.allygym-api.workers.dev/): Worker `5ee76fcc-0ace-4ee2-8f5d-dc8e76e1cdc4`, identical runtime fingerprint.
- Command: `npm run cloudflare:deploy`, pinned Node 22.16.0 and Wrangler 4.143.0 from clean merged main. Dry run passed first.
- Rollback: previous `.4` Worker `57796211-f2a8-4fc1-8381-4c9235bfb5bd` remains in deployment history.

[Sanitized deployment metadata](release/deployment.json), [rollback before promotion](release/rollback-before.json), [exact CI asset parity](release/ci-build-parity.json). This documentation records the release after deployment and changes no application runtime.

## Delivered behavior

Calm multiscale swells, real surface slopes, Fresnel/sky response and a broken moon path now describe a continuous surface. A throttled mirrored-camera pass replaces screen-remapped reflections. Hull sampling, interrupted disturbances, moving lantern anchors and damp coping connect boats and terrace to the water. Bursts briefly illuminate rough facets; their physically projected mirror may fall behind the quay, so source-aligned scattering supplies visible water illumination without relocating a firework image. [Burst-time capture at 3.5s](release/preview-burst-light-3.5s.png) and [seed/backend receipt](release/preview-burst-light.json) document that response.

Ultra retains four geometric waves/three normal scales, with one target capped at 512 pixels / 15 Hz wide or 384 pixels / 12 Hz portrait. Standard uses two waves/two scales and a 256-pixel cap at 15/10 Hz. Low and Canvas allocate no reflection target. Fitted geometry, shared scene transforms and one filtered lookup bound GPU work. Canvas keeps its fixed pools and at most 128 reflected sources / 384 marks; its final colour batching preserves fragment positions and counts.

Calm, Festival and Finale provide an opt-in **Hide controls** button. Ordinary chrome fades away and becomes inert; one **Show controls** button remains. Escape, manual mode, completion and errors restore controls. Shows continue uninterrupted, and app/OS reduced motion disables transitions. [Production immersive capture](release/webgpu-immersive.png).

## Qualification

[PR runtime CI 36907687943](https://github.com/samir1234khans/firecrackers/actions/runs/36907687943) and [main runtime CI 36911249851](https://github.com/samir1234khans/firecrackers/actions/runs/36911249851) passed all four jobs. PR documentation runs 36907680903/36907686663 and [main documentation 36911249306](https://github.com/samir1234khans/firecrackers/actions/runs/36911249306) passed. Units (244), lint/build, accelerated logical soak, audit and required browser/recovery checks passed. [PR receipt](release/pr-ci.json), [main receipt](release/main-ci.json).

Actual public production verification passed **456 checks**:

| Suite | Passed | Evidence |
| --- | ---: | --- |
| http | 32 | [http.json](release/http.json) |
| water | 53 | [water.json](release/water.json) |
| ui | 21 | [ui.json](release/ui.json) |
| original | 28 | [original.json](release/original.json) |
| flagship | 157 | [flagship.json](release/flagship.json) |
| grand | 42 | [grand.json](release/grand.json) |
| stage | 106 | [stage.json](release/stage.json) |
| viewability | 15 | [viewability.json](release/viewability.json) |
| offline | 2 | [offline.json](release/offline.json) |

Four further [normal-URL startup scenarios](release/startup-native.json) exercised production and preview natural startup plus repeated resizing before readiness at 1623×921 CSS / DPR 1.375. They preserved saved preferences, stayed on native WebGPU and launched in real time without alerts or fallback. QA clock stepping was not used for these cases.

Water, immersion, signature and stage suites check installed Chrome native WebGPU and forced native WebGL separately from Canvas. Original/collection/viewability/recovery suites use their existing software configuration where specified. Seven required sizes from 320×480 to 1920×1080 are covered; stage tests also cover the responsive breakpoint. Emulation is not physical-device evidence. [Preview regression summary](release/preview-summary.json) retains its separate 350 broader checks.

The [30 matched captures](final/comparisons.html) retain seed 20260916, exact logical times and backend labels against `.4`. Production asset parity establishes the same delivered runtime; captures are not FPS evidence.

## Performance evidence

[Component qualification](final/performance-qualified-components.json) passed 18 primary/observer cadence groups and 12 transition groups within the unrounded p95 allowance `max(2 ms, 20% baseline)`, with no new >50/>100 ms transition in at least two paired repetitions. CPU submission is reported separately from observer rAF and app-rendered cadence; no completed GPU time is claimed.

The unchanged WebGPU/WebGL component was measured in the complete `.10` 48-run experiment. That experiment remains globally failed because its Canvas component failed. The final `.11` Canvas-only 16-run experiment passed. [Source equality](final/gpu-source-equivalence.json) and [76 committed source hashes rechecked on merged main](release/source-proof-recheck.json) establish the unchanged GPU code; the only source differences were Canvas and CONFIG_VERSION display metadata. Full fingerprints remain distinct. These experiments are not presented as one final-build run. Earlier failures/raw intervals/checksums remain retained.

The original baseline was production `.4` before promotion. The retained [burst preview](https://firecrackers-burst-preview.allygym-api.workers.dev/) still has the exact `.4` fingerprint ([manifest check](release/retained-baseline.json)) for future comparisons; production now serves `.11`.

## Retained incidents and boundaries

The first production water run encountered three `ERR_QUIC_PROTOCOL_ERROR` asset requests and timed out on its strict all-assets-active check. The app remained playable with fallback detail. [Failure](release/first-quic-failure.json) and [fallback capture](release/first-quic-fallback.png) remain retained. A fresh normal browser passed all 53 checks without transport flags, ignored errors, changed assertions or app edits.

The pre-promotion [startup comparison](release/startup-before-production.json) passed both `.11` cases but reproduced a transient resize-recovery alert on old `.4`; its whole comparison exited nonzero and is not relabelled a pass. Both production/preview `.11` cases passed after promotion. Earlier harness repairs and infrastructure timeouts are documented in [qualification history](FINAL-QUALIFICATION.md); functional/performance assertions were not relaxed.

[68-ref reconciliation](release/refs.json) found every current feature/fix/documentation branch integrated in main. The historical alternate five-effect JavaScript branch remains preserved under AGENTS.md and contains no missing current capability. The old PR #2 head is also already contained in main. Canonical main and the separate documentation worktree were clean; no reset, force push or branch deletion was used.

Physical phones, Safari, completed GPU timing and sustained thermal/endurance behavior remain **NOT TESTED**. The shared Windows PC and browser-emulated viewports do not qualify those platforms.
