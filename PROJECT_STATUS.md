# Project status

Updated: 16 September 2026.

## Current stage

**Working V1 implementation; isolated preview deployed. Production/realism sign-off remains open.**

Preview: https://firecrackers-a93nle.v2.appdeploy.ai/

The implementation is on `feat/fireworks-v1`; `main` remains the preserved documentation baseline. No custom domain, production migration, account system, backend, or native Android wrapper was created.

## Implemented

A runnable React/Vite/TypeScript application, Three.js WebGPU renderer with WebGL 2 fallback, five-family seeded fixed-step simulation, bounded particle/trail/smoke/light/voice pools, deliberate fuse ignition and cancellation, drag/placement alternatives, 3D rocket props, drifting illuminated smoke, procedural spatial audio, opt-in haptics, automatic shows, manual priority, pause and hidden-page recovery, responsive glass UI, keyboard controls, comfort preferences, onboarding, reset, fullscreen/install/wake-lock feedback, offline PWA and explicit-update handling. Reproducible build configuration, engine/browser tests, CI, original icon generation and third-party notice generation are included.

## Verified evidence

- 18 engine tests passed locally and in GitHub Actions.
- Accelerated two-hour logical simulations at Low and Standard stayed within caps. These are not real-time GPU or device endurance tests.
- Build, typecheck, lint and documentation validation passed.
- Run 35062832838 passed 10 browser cases. Run 35063650709 passed the expanded 12-case desktop/mobile Chromium suite, capturing every family and exercising offline cold load, sound activation, hold cancellation, show takeover, preferences and reset.
- The preview host reports ready, with no reported frontend/backend errors at deployment completion. Its separate QA result field was not supplied; the browser evidence above comes from GitHub Actions.

## Hardening in this commit

The second run deliberately failed its separate security gate for two high-severity build-tool dependency findings. This commit pins the fixes reported by the actual npm audit: Vite 6.4.3 and PostCSS 8.5.28, binds local servers to loopback, and preserves runtime third-party license text. The next CI run must validate this exact hardening revision; the previous successful runtime run is not a clean-audit claim. Final run identifiers and outcomes belong in the runtime evidence record.

## Outstanding release gates

Physical Android/tablet and Safari/iOS sessions, hardware WebGPU/WebGL parity, 30-minute device and two-hour real-time display/thermal tests, interruption/context-loss and service-worker update/recovery matrix, flash-risk/accessibility review, and owner approval of the final realism/art/audio quality. Smoke uses layered billboards and glow uses additive particle kernels; a full volumetric solver, GPU-compute simulation, HDR bloom and professionally recorded festival sound are not implemented.

The final consumer brand, public code license, permanent hosting/domain and professional audio budget remain non-blocking owner choices until release. See [runtime implementation evidence](docs/evidence/runtime-implementation.md) for the acceptance matrix and continuation instructions.
