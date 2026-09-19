# Project status

Updated: 19 September 2026.

## Current delivery

**Realism V3 / UI V3, build `2026-09-19.4`: implemented, browser-verified and deployed to the existing preview.** Production hardware and final owner art/audio approval remain separate gates.

Preview: https://firecrackers-a93nle.v2.appdeploy.ai/

Runtime checkpoint: `dabd00c8358f65e961ac4c67eea89043016e9165` on `feat/fireworks-v1`. Subsequent delivery tooling adds the public source fingerprint and verification without changing these tested runtime modules. No promotion to `main`, branch deletion, native wrapper, new backend or custom-domain migration occurred.

## Delivered functionality

The cinematic command deck, radial ignition, family artwork/inspector, mobile/landscape arrangements and matching settings/onboarding/show panels are now delivered together with the real 3D launch stage. The observatory environment, printed-paper rocket materials, shared fuse curve, fuse/exhaust/residue smoke, connected trails, detached embers, colored local smoke illumination, perspective and native bloom are included.

All five families, deliberate hold/cancel, single-action and keyboard alternatives, sound-off startup, opt-in haptics, finite and continuous show modes, manual takeover, protected display output, transparent overlay, offline caching and explicit update handling are retained.

Ultra graphics, Festival selection and 60 fps presentation targets remain the defaults. Reduced flashes stays enabled. These are settings, not an FPS guarantee.

## Delivery fixes completed on 19 September

Visible frame time is now consumed through bounded fixed-step slices, instead of dropping all elapsed time above 100 ms and stretching the fuse/flight on slow renderers. Idle scenes avoid redundant rendering, with immediate redraw on selection and resize. The smoke-depth pass uses inexpensive opaque proxies rather than repeating PBR shading. The floor uses authored stone tone plus a changing burst wash; the hero stage and rocket retain PBR materials.

Selecting the next family during a burning fuse now works without cancelling or mutating the committed rocket. Manual takeover stops future automatic launches immediately. Regression tests cover both changes.

## Verified results

- GitHub Actions runtime run `35437161311`: desktop and mobile jobs both successful.
- 51 engine, lifecycle and configuration tests passed.
- 44 browser cases passed: 22 desktop and 22 mobile Chromium emulation; zero failures, flaky cases or skips.
- TypeScript, lint, production build, dependency security review and 258 documentation checks passed.
- Accelerated 7,200-second logical simulation passed, with bounded heads/trails/smoke/cues/rockets. It is not a two-hour wall-time graphics test.
- Actual desktop, portrait and landscape captures reviewed, including the launch stage, fuse, break and late canopy.
- Four dedicated source-fingerprint tests passed. Public source verification run `35439359156` passed for all 21 delivered upgrade modules, excluding only audited static host diagnostic labels.
- The receipt-enabled local build produced the same four compiled JS/CSS asset bytes as the verified CI build. The receipt itself is an additional public diagnostic file.

The exact published snapshot and public source-parity result are recorded in [the delivery evidence](docs/evidence/realism-v3-delivery.md), alongside the remaining tests. The host's ready status is not substituted for completed browser evidence.

## Still open beyond this delivery

Physical Android/tablet and Safari/iOS checks; hardware WebGPU/WebGL comparison; actual OBS composition; long-session GPU, thermal and power behavior; comprehensive context-loss/update/rollback testing; flash-risk/accessibility assessment; listening review and final owner visual approval.

Higher-end authored GLB/PBR models, Blender-baked smoke, a recorded audio library and further trail/atmosphere art direction remain optional next fidelity milestones, not features silently claimed as finished. No live fluid solver or GPU-compute migration was performed.
