# Open sky candidate — preview receipt

Build `2026-10-01.3` is available at the [isolated Cloudflare preview](https://firecrackers-open-sky-preview.allygym-api.workers.dev/). [PR #27](https://github.com/samir1234khans/firecrackers/pull/27), branch `feat/open-sky-controls`, includes the retained moon/water and thirteen-effect candidate. It has not been merged or promoted to production.

## Source and deployment

- App source: `2d4d7f18364eb175ab8c5e8cc6b3398d4f7afcde`.
- Delivered source fingerprint: `c12b1d0bde59ba1e0967c9bbda00768d8c645078267ade88c9f42a7b60af0637`.
- Preview Worker version: `15f3c3a7-b056-4929-89de-b4754a93d5a6`.
- Preview configuration: `wrangler.open-sky-preview.jsonc`, with no production route.
- Baseline: selected candidate `7946153`; retained flagship preview build `.2`, fingerprint `68b3edd31b552121b7eda0f2262739093e03ef893fc8e2b93d2372f4fdde1b6d`.
- Production retained: `2026-09-30.8`, fingerprint `5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535`, Worker `5a577d62-1deb-4770-b780-784d03574c7a`.

## Visible changes

The visible brand and collection headings are removed. Thirteen named, keyboard-accessible firework icons occupy a transparent left collection. Pause, Sound and Controls sit at lower right; the four-direction mode knob and precise fixed/random position track occupy the footer. The rocket is scaled to the available view and grounded on a subdued steel/brass support with a cached contact shadow. The moon, water, boats, authored terrace and thirteen effect identities are retained.

First load displays the actual moon at the center, gently rotating, while truthful graphics/asset preparation status covers the assembling scene. Once ready, the moon moves to the renderer's exact sky position and the waterfront appears. Reduced motion skips travel/rotation. Failed assets, slow startup, compatibility graphics and explicit early entry remain usable. There is no artificial progress percentage or minimum waiting period. Controls become interactive only after presentation completes.

See [implementation contracts](IMPLEMENTATION.md), the historical [approved layout plan](PLAN.md), and the [matched before/after gallery and moon intro video](comparison.html).

## Validation

- Typecheck, unused-code lint, production build and **217 unit tests passed**.
- Accelerated two-hour logical soak passed: 1,290 launches, 3,995 bursts; bounded maxima of 858 particle heads, 20,000 trail entries, 64 smoke entries, nine cues and four rockets. This is not physical-device endurance evidence.
- **37 native control checks** passed: all thirteen props at 320×480, 375×667, 393×851, 768×1024, 844×390, 1280×800 and 1920×1080 on WebGPU, WebGL and Canvas. Mode selection/drag/cancel, focus, manual pause, finite Finale, full-range/fine placement, Random, reset and immutable flights through rotation passed.
- **546 endpoint checks** passed: thirteen families × seven viewports × two placement endpoints × three actual backends. Signature principal heads remain inside safe bounds; original families retain their complete visible expansion. Depth-aware inward aim preserves effect size.
- **8 final startup checks** passed on the exact delivered fingerprint, including held/failed assets, real progress, exact moon handover, early entry, reduced motion and startup recovery.
- Native stage **106**, signatures **157**, signature touch **9**, moon/water **26**, Grand **42**, original launch/platform **28**, Galactic **35**, asset loading **1**, asset lifecycle **7**, overload **5**, viewability/recovery **15**, offline/recovery **2** passed during candidate validation. Detailed receipts distinguish earlier engine-identical runs from final startup-integrated runs; these are not a fabricated single-run total.
- Panels: initial full **183** passed; after startup integration, **181 passed with one stale test-coordinate/timing failure**. The fixture was repaired to wait for presentation, and its final targeted **2** assertions passed. CI runs the complete repaired suite.
- High-severity dependency audit passed. One existing low-severity `serialize-javascript` advisory remains; pinned dependencies were not silently upgraded.

### Hosted and CI checks

The final hosted build passed **32 checks**: all 30 emitted files returned HTTP 200 with byte-for-byte parity, and fresh no-QA default startup/launch/panel/mode checks passed on phone and desktop with actual WebGPU. Production's unchanged fingerprint was asserted. Hosted native touch passed **9** cases across WebGPU/WebGL/Canvas; actual service-worker offline reload and injected WebGL context loss/recovery passed **2** cases. All three reports have zero unexpected errors. See [hosted](checks/hosted.json), [touch](checks/hosted-touch.json), [offline](checks/hosted-offline.json), and [local regression inventory](checks/validation-summary.json).

The PR runs the complete engine, desktop, mobile and recovery CI workflow, including the repaired full panel suite. [Current exact-head checks](https://github.com/samir1234khans/firecrackers/pull/27/checks) are authoritative; the handover reports their final result. No main CI or production deployment was initiated for this preview-only candidate.

### Performance comparison

Native desktop Chrome/WebGPU, Ultra, same seed/effect/relative age, 30 warmup renders and four-second samples; AB/BA order for each pair. Values below average the two run-level CPU-submission p95 values, in milliseconds. These are not completed GPU timings. The first baseline sample may overlap the final capture teardown; the focused repeat ran with all test browsers closed beforehand.

| Emulated viewport | Effect | Baseline | Candidate |
| --- | --- | ---: | ---: |
| 393×851 | Willow | 7.95 | 7.65 |
| 393×851 | Imperial Crown | 9.10 | 10.30 |
| 393×851 | Royal Phoenix | 9.00 | 10.75 |
| 1280×800 | Willow | 7.05 | 7.30 |
| 1280×800 | Imperial Crown | 9.95 | 8.80 |
| 1280×800 | Royal Phoenix | 9.30 | 9.90 |

A focused phone-sized Phoenix repeat measured **8.70 → 9.45 ms** CPU p95 (+0.75 ms, ~8.6%); CPU p50 was **4.50 → 4.80 ms**. Initial tails were noisier. Overall sampled rAF p95 remained 8.4–12.6 ms, with viewport/effect-dependent scheduling differences. This supports continued preview review, not a claim of identical performance or physical-mobile qualification. The changed composition also slightly changes live particle occupancy at matching visual ages. See [all 24 samples](checks/performance.json) and [four focused repeat samples](checks/performance-phoenix-repeat.json). No expensive full-screen pass or new per-frame particle allocation was introduced.

Recommendation: ready for functional and visual merge review once exact-head CI passes. Keep production promotion separate; qualify representative physical phones/Safari and sustained GPU behavior before claiming a universal performance pass.

## Findings corrected during review

Tests caught a missing reset of the independent Random placement stream and native dialog focus escaping into browser chrome; both are corrected. Fine placement now changes sensitivity continuously. Clear-sky test coordinates were moved away from the new left collection without relaxing accidental-launch checks. Terrace assertions use measured usable bounds. Signature endpoint projection accounts for near-depth magnification; it does not shrink the bursts. Startup tests distinguish engine-ready from presentation-ready. The moon handover includes the authored texture's transparent rim, avoiding a size jump.

## Evidence boundaries

Captures use emulated CSS viewport sizes and an actual desktop GPU, seed `20260916`, with matching relative burst times. The moon video uses fresh default startup with a deliberately held rocket asset to show real progress. They are not physical phones or Safari. Projected envelopes verify geometry contracts; visual inspection separately checks rendered ground contact and appearance. The support uses real-time materials and geometry, not a claim of universal 4K rendering.

Physical Android/iPhone, Safari, real browser/OS 200% zoom, mobile browser-bar behavior, sustained GPU/thermal performance and completed GPU-frame timing remain untested. Short desktop submission/rAF samples cannot certify those conditions. Production promotion remains a separate decision.

The first full CI pass found three obsolete fixture assumptions (focus before its restoration frame, engine readiness before presentation, and the former compatibility-link label) plus an actual Linux short-landscape recovery-card overflow. The fixtures now wait for the required observable states and exact current label; the error card is capped to 60dvh with scrollable 48px actions. Its test forces wrapped actions on every platform. Existing limits and launch/focus assertions remain intact. Captures and performance samples retain their recorded f361 source; the final c12b source differs only in the error-card height cap. Subsequent full CI checks cover the complete final build.

Post-repair local checks passed: 16 software WebGL/Canvas control cases, 48 software endpoint cases, three targeted viewability/recovery cases, and four forced-wrap entry-recovery assertions. The final c12b build again passed all eight startup cases and all 32 hosted byte-parity/default-startup checks. Detailed repair receipts are in checks/ci-controls-fixed.json, checks/ci-software-edges.json, checks/ci-viewability-fixed.json and checks/ci-error-cap-fixed.json.
