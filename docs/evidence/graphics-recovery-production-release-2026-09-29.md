# Graphics loading and overload recovery — production receipt

[Firecrackers production](https://firecrackers.mainandmany.com/) serves build `2026-09-29.6` from main merge commit `9ff7d5fe901a7815b658337b1150ed443a1a0313` ([PR #12](https://github.com/samir1234khans/firecrackers/pull/12)). Cloudflare Worker `firecrackers` version `e5691b68-1c68-4392-b749-22c5f9f5e6bc` was deployed on 29 September 2026 at 18:18 UTC. The prior `.5` Worker version `0dd30a40-e7ca-41b1-8723-0bbe6574bcbe` remains in Cloudflare deployment history as the immediate rollback reference.

The public `/release.json` reports SHA-256 `e05400864811cb02531e7dfa4a4de24c52106c6b92b4ec908392a6f5e7261534` across 50 delivered source and asset entries. This matches the clean main build and the [isolated Cloudflare preview](https://firecrackers-graphics-preview.allygym-api.workers.dev/). The custom-domain HTML, PWA manifest, service worker, rocket GLB, terrace GLB, and smoke atlas each returned HTTP 200.

## Delivered behavior

- All six original authored art assets load independently. A slow or missing file cannot withhold the others; procedural fallback stays usable. Renderer diagnostics identify each asset as loading, ready, active, or failed.
- Repeated severe active-frame delays switch the renderer to Canvas while keeping the current firework simulation, mode, pause behavior, saved quality, and sky/terrace drag positions. The app identifies compatibility graphics to the user. Ultra remains the default.
- Particle, trail, smoke, and render-pixel ceilings remain bounded. They did not gate art downloads; the [baseline diagnosis](graphics-loading-diagnosis-2026-09-29.md) found a severe software-WebGL stall with every asset loaded, so raising those limits would have increased the measured work.

## Verification

| Gate | Evidence |
| --- | --- |
| Reviewed source and CI | [PR runtime run 36610036689](https://github.com/samir1234khans/firecrackers/actions/runs/36610036689) passed engine, desktop, mobile, and recovery jobs, including the two new browser regressions. [Post-merge main runtime run 36610891100](https://github.com/samir1234khans/firecrackers/actions/runs/36610891100) and [main documentation run 36610889743](https://github.com/samir1234khans/firecrackers/actions/runs/36610889743) passed. |
| Local candidate | Typecheck, lint, production build, 128 unit/engine tests, 417 documentation/configuration checks, and dependency audit with zero vulnerabilities passed. A 7,200-second accelerated logical soak completed with bounded particles and 1,317 launches / 2,875 bursts. |
| Public stage and drag | [34 checks passed](graphics-recovery-v6/production-stage-report.json), zero errors, across seven required viewport sizes, sky/terrace drag, authored assets, reflection budgets, pause, sound, and missing-asset fallback. |
| Public ten-effect collection | [19 desktop](graphics-recovery-v6/production-grand-desktop-report.json) and [24 mobile](graphics-recovery-v6/production-grand-mobile-report.json) checks passed, zero errors, on WebGL and Canvas. |
| Public original playback/platform | [13 desktop](graphics-recovery-v6/production-flow-desktop-report.json) and [16 mobile](graphics-recovery-v6/production-flow-mobile-report.json) checks passed, zero errors, including launch, pause, shows, offline reload, and protected output. |
| Public recovery/viewability | [15 checks passed](graphics-recovery-v6/production-recovery-report.json), zero failures. |
| Public new regressions | Independent delayed/failed-asset activation passed. [Five overload recovery checks](graphics-recovery-v6/production-overload-report.json) passed, zero errors: same rocket continues through the real renderer handoff, saved Standard quality and manual pause survive, sky/terrace drag still maps, and Festival with Ultra continues. The slow-frame samples are injected through `?qa=1` for deterministic functional testing. |

[Desktop WebGL Saturn](graphics-recovery-v6/production-desktop-webgl-saturn.png), [mobile WebGL Saturn](graphics-recovery-v6/production-mobile-webgl-saturn.png), and [Canvas after recovery](graphics-recovery-v6/production-recovered-canvas.png) are captures from the actual public domain. They are browser appearance evidence, not physical-device performance measurements.

The public and CI browser runs use Chromium, software WebGL, and mobile emulation. Physical Android/iPhone hardware, Safari, hardware WebGPU, sustained device frame rate, and thermal endurance remain unverified. The owner's device/browser that prompted the report remains unknown; this release fixes the reproduced stalled-renderer path and the independent-asset-loading weakness, without claiming to diagnose every device-specific loading problem.
