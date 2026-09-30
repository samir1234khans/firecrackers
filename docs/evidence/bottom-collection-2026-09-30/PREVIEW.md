# Verified Cloudflare redesign preview

[Open isolated preview](https://firecrackers-redesign-preview.allygym-api.workers.dev/) · [PR #24](https://github.com/samir1234khans/firecrackers/pull/24) · [matched before/after gallery](comparison.html)

Build `2026-09-30.8`; final app changes `2f5df91bb9552e743cf6e07cbc07b7339843503f`, final PR head `a57f4235bf02a5294d9d378fba3b28dd05e067e6` (test-only cadence correction), merged main `585d82e5aa135cf6f6ef7729b81a6f40f8798ef9`. Branch `feat/bottom-tray-upper-canopy` is retained. Preview Worker `8379ef0e-598b-4a50-a728-77eb9a96f996`. Exact 66-entry fingerprint `5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535`. Preview verification preceded production promotion; the production receipt records public-domain verification separately.

## Passed

- 154 unit/engine tests, typecheck, lint, build, 7200-second accelerated logical soak, audit (zero vulnerabilities) and documentation structure. Node22.16.0 pinned runtime. Existing preview servers held native binaries during npm ci; clean lockfile install succeeded in an isolated temporary directory and restored identical package files without stopping unrelated servers.
- [106 hosted stage checks](preview/stage-hardware.json): installed Chrome, native WebGPU (non-fallback adapter), hardware forced WebGL and Canvas separately. All seven requested sizes plus679/680, ten direct launches, upper profiles, drag/cancel/terrace/rotation/panels/keyboard/audio. [All ten native effect captures](preview/effects).
- [201 panel checks](preview/panels.json): native focus, modal inertness, manual pause, Controls, all sections/reset, scroll, loading/update/recovery,7 viewports,200% CSS reflow/DPR2 and doubled text. These are emulation, not physical-phone or OS zoom qualification.
- [42 Grand Collection](preview/grand.json), [28 original launch/offline/platform](preview/original.json), [15 viewability/recovery](preview/recovery.json). No unexpected errors; intentional fault diagnostics remain labelled.
- Authored-asset loading and texture lifecycle plus [five overload recovery checks](preview/overload.json) preserve flight/show/Ultra through renderer handoff. Independent browser capability behavior remains truthful.
- [29 exact HTTP/assets byte checks](preview/http.json), including PWA assets and release fingerprint.
- [35 galactic input/shared-clock/comfort checks](preview/galactic.json) passed on final source with a bounded observed-clock cadence sample.
- [Live-clock default startup/cadence comparison](preview/performance.json): installed Chrome default native WebGPU+Ultra and all eight authored enhancements.10s warmup plus20s Festival sample per viewport/origin. Desktop and phone viewport rAF p95 `.7`4.3ms → `.8`4.3ms. No material p95 regression in this short PC sample. This is browser cadence/submission evidence, not completed GPU timings or physical thermal/endurance qualification.

## Before and after

Captures use seed20260916, reset to simulation time0, then normal Gold Willow launch and4.9 seconds. Phone393×851, tablet768×1024 and desktop1280×800 all show actual WebGPU. JSON snapshots retain origin, backend and source fingerprint. No generated comparison imagery.

## Limits and retained pilots

Physical Android/iPhone, Safari, actual phone safe-area/browser-bar behavior, thermal endurance and completed GPU timing remain NOT TESTED. At320×480 the fixed portrait horizon plus128px tray leaves a shallow visible water/terrace band; prop ground contact remains visible. Full native OS zoom is not established by CSS reflow/DPR emulation.

During integration, an initial portrait horizon shift was detected and fixed using two stationary camera anchors. Obsolete selector/timing pilots failed before tests were migrated to the approved UI and flight duration. Earlier successful candidate reports remain in `preview/pilot` with their original source snapshots. A [native startup timeout](failures/native-startup-timeout.json) recorded zero application errors; independent startup and the full isolated native rerun passed. The [first CI ambient sample](failures/ci-ambient-attempt1.json) saw zero frames in a fixed800ms software-rendering interval despite a visible, unpaused, motion-enabled scene. The check now waits at most ten seconds for a resumed frame and retains positive-frame, timeout and original20/10fps upper-rate gates against observed browser time. It does not accept zero frames. No runtime change was justified by that artifact. [Final PR CI](pr-ci.json) and [source-main push CI](main-ci.json) passed all four jobs; [PR documentation](pr-doc-ci.json) and [main documentation push](main-doc-ci.json) passed. Previous Worker `e167225e-e463-41f6-897d-e6f5b59aa03c` remains rollback baseline.
