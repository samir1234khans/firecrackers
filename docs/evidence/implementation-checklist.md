# Implementation and preview preflight

## Implementation checklist

Preserve all existing documentation. Use one feature branch from current main. Build the fixed-step seeded engine, bounded pools, all five families, 3D launch props, shared smoke and lighting, spatial procedural audio, deliberate and accessible ignition, responsive glass controls, paced shows, pause/recovery, privacy-safe preferences, browser capability feedback and explicit-update offline PWA. Keep React out of frame-by-frame simulation. Add pure-engine tests, logical soak and desktop/mobile browser flows.

## Preview preflight

Architecture is frontend-only React/Vite; there are no backend routes, remote runtime assets, accounts, API keys, purchases or domain changes. Direct package versions are pinned; resolve and retain a real transitive lock. AppDeploy, when used, receives only new files and exact template diffs, plus a complete tests/tests.json array with five coverage-mapped workflows and exactly one sanity test. Existing code and test source stay in GitHub. Generated PNG icons come from the original checked-in generator rather than user file uploads.

## Validation boundary

Pure-engine tests are not renderer tests. Accelerated logical simulation is not a physical-device or GPU soak. Browser-emulated mobile is not real Android or iOS hardware. A successful build is not photorealism approval or flash-risk certification. Record actual results and leave these gates visible.
