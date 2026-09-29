# Firecrackers borderless controls and placed launch — production receipt

`https://firecrackers.mainandmany.com/` serves build `2026-09-29.5` from main merge commit `b8174710651dc7424a75551f93bfe317955cdf57` ([PR #10](https://github.com/samir1234khans/firecrackers/pull/10)). Cloudflare Worker `firecrackers` version `0dd30a40-e7ca-41b1-8723-0bbe6574bcbe` was deployed on 29 September 2026 at 16:42 UTC. The prior `.3` Worker version `5c39c81a-6b79-49ae-bf50-007a93ee83f6` remains in deployment history as the rollback reference. The intermediate `.4` shelves build was merged to main but was never promoted to this production domain.

The public `/release.json` reports SHA-256 `36bebaa351ce233d0c8bab75e57a4cdaa33a587ab977edda5854116c3796034d` across 50 delivered source and asset entries. This matches both the tested isolated [preview](https://firecrackers-pad-preview.allygym-api.workers.dev/) and the clean main production build. The HTML shell, PWA manifest, service worker, `terrace-v004.glb`, and smoke atlas each returned HTTP 200 at the public custom domain. The fingerprint scope is the listed modules and assets, not a claim that every host response byte is identical.

## Release behavior

- Borderless, transparent firework icons and flame-only Launch actions preserve 44/48-pixel minimum control targets and a 56-pixel main Launch target. The selected style's quick flame remains visible; other quick flames appear instantly on hover/focus.
- Dropping a style in the sky gives one immediate burst. Dropping it at terrace height lights a normal fuse and flight from the released horizontal position. Invalid/canceled drops preserve state, and a phone dock moves out of the way during a captured drag.
- The next rocket model and Launch action are ready as soon as the active flight bursts, subject to the existing particle budget. Active fuse/flight admission still rejects duplicates. WebGL and Canvas follow the same lifecycle.
- Stage measurement reserves quick-action space so focus and hover cannot change the central camera framing.

## Verification

| Gate | Evidence |
| --- | --- |
| Reviewed source | PR #10 merged at commit above; PR runtime run [36597477950](https://github.com/samir1234khans/firecrackers/actions/runs/36597477950) and post-merge main runtime run [36598451099](https://github.com/samir1234khans/firecrackers/actions/runs/36598451099) passed engine, desktop, mobile and recovery jobs. Main documentation validation [36598450740](https://github.com/samir1234khans/firecrackers/actions/runs/36598450740) passed. |
| Local source | TypeScript, lint and production build passed; 125 unit/engine tests passed; 387 documentation/configuration checks passed. A 7,200-second accelerated logical soak completed with bounded particles/resources. |
| Public stage and drag | [34 checks passed](pad-launch-v5/production-stage-report.json), zero page errors, including all requested viewport sizes, immediate selected quick action, sky and terrace drops on desktop/mobile, placement, pause, audio and asset fallback. |
| Public all-ten collection | [42 checks passed](pad-launch-v5/production-grand-report.json), zero page errors, on desktop and emulated mobile WebGL/Canvas; all ten effects completed and cleaned. |
| Public original playback/platform | [28 checks passed](pad-launch-v5/production-original-report.json), zero page errors, including rapid second launch, duplicate rejection, manual takeover, offline cold reload and transparent output. |
| Public recovery/viewability | [15 checks passed](pad-launch-v5/production-recovery-report.json), zero failures. |

[Desktop Sapphire Saturn](pad-launch-v5/production-desktop-webgl-saturn.png) and [mobile Sapphire Saturn](pad-launch-v5/production-mobile-webgl-saturn.png) are actual WebGL captures from the public domain. The [preview evidence](pad-launch-preview-2026-09-29.md) separately contains candidate captures and the design/interaction test detail.

Physical Android/iPhone touch, Safari, hardware WebGPU, and sustained real-time frame/thermal targets have not been verified by these Chromium and emulated-mobile tests. The logical soak does not establish device performance. The deployed Worker can be restored to version `5c39c81a-6b79-49ae-bf50-007a93ee83f6` through Cloudflare deployment history if a later public issue requires rollback.
