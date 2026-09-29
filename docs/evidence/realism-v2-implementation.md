# Cinematic V2 implementation evidence

Date: 16 September 2026. Configuration version: `2026-09-16.2`.

## Candidate implementation

This commit contains actual runtime source, not a compressed source payload or another planning package. The existing application and five identities remain intact. Main and the divergent alternate implementation branch are unchanged.

Implemented: fixed-world perspective; separate thrust/coast motion; stable particle identities and owned connected trail segments; spatial crossette splits; visible finale carriers; original three-variation animated density/gradient smoke atlas; local colored smoke illumination and depth-bucket compositing; native Three.js r180 bloom/output; paper-grain rocket variants, moving fuse ember and ignition light; presentation/transparent output with allowlisted seeded links and a protected rectangle; responsive glass refinements; pause-intent, wake-lock cancellation and audio lifecycle fixes.

## Actual local checks before this commit

TypeScript checks, the production build and 45 engine/lifecycle/configuration regression tests passed in Node 22.16.0 using the exact dependency set restored from the repository's npm-ci verification artifact. No new runtime dependency was added. The build precaches the generated runtime assets.

Local Chromium navigation is blocked by its managed policy, including localhost and file URLs. The policy was not changed or bypassed. Browser verification is therefore delegated to the repository's GitHub Actions Playwright runner. This commit does NOT predeclare that run passed. Inspect the source-specific workflow and downloaded screenshots before treating the candidate as visually verified or updating the preview.

The browser suite includes five V2 scenarios in addition to the existing six scenarios, each configured for desktop and mobile Chromium emulation. A `?qa=1` diagnostic exposes bounded fixed-step advancement and capture-freeze for repeatable rendered checkpoints. Such captures use the actual renderer, but accelerated simulation is not real-time FPS or device endurance evidence.

## Explicit deviations and remaining gates

Smoke and prop assets are original procedural work. They are not Blender fluid bakes, imported GLB masters or professional recorded audio. Trails are connected instanced segments, not an independently benchmarked GPU-compute/ribbon implementation. Internal linear targets and bloom do not imply HDR-display output.

Browser-rendered appearance, alpha composition, all-family captures, regression results and deployment-source parity must be recorded after the current CI result. Hardware WebGPU parity, physical phone/tablet and Safari sessions, actual OBS integration, sustained GPU/thermal tests, flash/accessibility review and owner art/audio approval remain unverified. No production release or main promotion is claimed by this candidate commit.
