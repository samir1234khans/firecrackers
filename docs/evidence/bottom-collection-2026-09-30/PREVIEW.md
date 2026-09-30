# Verified Cloudflare redesign preview

[Open isolated preview](https://firecrackers-redesign-preview.allygym-api.workers.dev/) · [PR #24](https://github.com/samir1234khans/firecrackers/pull/24) · [matched before/after gallery](comparison.html)

Build `2026-09-30.8`; app source commit `606cd43303dded22c45c89940988528d591d83c8` on `feat/bottom-tray-upper-canopy`. Preview Worker `08c6035e-1498-45d9-af2a-55e9e1468b90`. Exact 66-entry fingerprint `4b17e6fe7b6519271b35ffdefd1dab940441c6842ef39b6a42f184b8ba7b8e85`. Production still `.7` at this checkpoint.

## Passed

- 154 unit/engine tests, typecheck, lint, build, 7200-second accelerated logical soak, audit (zero vulnerabilities) and documentation structure. Node22.16.0 pinned runtime. Existing preview servers held native binaries during npm ci; clean lockfile install succeeded in an isolated temporary directory and restored identical package files without stopping unrelated servers.
- [106 hosted stage checks](preview/stage-hardware.json): installed Chrome, native WebGPU (non-fallback adapter), hardware forced WebGL and Canvas separately. All seven requested sizes plus679/680, ten direct launches, upper profiles, drag/cancel/terrace/rotation/panels/keyboard/audio. [All ten native effect captures](preview/effects).
- [201 panel checks](preview/panels.json): native focus, modal inertness, manual pause, Controls, all sections/reset, scroll, loading/update/recovery,7 viewports,200% CSS reflow/DPR2 and doubled text. These are emulation, not physical-phone or OS zoom qualification.
- [42 Grand Collection](preview/grand.json), [28 original launch/offline/platform](preview/original.json), [15 viewability/recovery](preview/recovery.json). No unexpected errors; intentional fault diagnostics remain labelled.
- Authored-asset loading and texture lifecycle plus [five overload recovery checks](preview/overload.json) preserve flight/show/Ultra through renderer handoff. Independent browser capability behavior remains truthful.
- [29 exact HTTP/assets byte checks](preview/http.json), including PWA assets and release fingerprint.
- [Live-clock default startup/cadence comparison](preview/performance.json): installed Chrome default native WebGPU+Ultra and all eight authored enhancements.10s warmup plus20s Festival sample per viewport/origin. Desktop rAF p95 `.7`8.4ms → `.8`4.3ms; phone viewport4.3ms →4.3ms. No material p95 regression in this short PC sample. This is browser cadence/submission evidence, not completed GPU timings or physical thermal/endurance qualification.

## Before and after

Captures use seed20260916, reset to simulation time0, then normal Gold Willow launch and4.9 seconds. Phone393×851, tablet768×1024 and desktop1280×800 all show actual WebGPU. JSON snapshots retain origin, backend and source fingerprint. No generated comparison imagery.

## Limits and retained pilots

Physical Android/iPhone, Safari, actual phone safe-area/browser-bar behavior, thermal endurance and completed GPU timing remain NOT TESTED. At320×480 the fixed portrait horizon plus128px tray leaves a shallow visible water/terrace band; prop ground contact remains visible. Full native OS zoom is not established by CSS reflow/DPR emulation.

During integration, an initial portrait horizon shift was detected and fixed using two stationary camera anchors. Obsolete selector/timing pilots failed before tests were migrated to the approved UI and flight duration; those failures were not erased into successful claims. Final suites above use the exact preview fingerprint. Previous Worker `e167225e-e463-41f6-897d-e6f5b59aa03c` remains rollback baseline. Required PR/main CI and production verification are separate gates.
