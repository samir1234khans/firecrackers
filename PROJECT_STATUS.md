# Current status: Waterfront upgrade

**Production deployed and verified:** https://firecrackers.mainandmany.com/. Worker version `204d3c26-6c11-485b-9137-2b59a647ad0e`; PR #5 merged.

Build `2026-09-29.2` implements the approved six-zone stage, transparent compact controls, touch/mouse drag-to-burst, Blender assets, event-driven water reflections and optional recorded sound.

Current evidence and deployment identifiers: [waterfront release receipt](docs/evidence/waterfront-delivery-2026-09-29.md). Physical iPhone/Android performance and hardware WebGPU remain unqualified; browser emulation does not establish those targets.

## Earlier status record

# Project status

Updated: 29 September 2026. Build: `2026-09-29.1`.

## Current integration baseline

**Main is the canonical application baseline for the owner-authorized Grand Collection promotion.** Start new work from main rather than resuming an older five-effect recovery or V3 branch. The promotion pull request and post-merge workflow results record its exact merge and verification status; see [the promotion audit](docs/evidence/main-promotion.md).

The incoming delivery is `feat/grand-collection` at `7b448ee730ba1170149e0a5d7d1e3895862a6ad1`. It already incorporates every current head of the approved V3, ignition, video-flow and viewability-recovery development lines. The separate historical `feat/fireworks-v1-implementation` remains preserved without replacing the tested application. No branch deletion or force push is part of the promotion.

Cloudflare production: https://firecrackers.mainandmany.com/ . Prior AppDeploy preview: https://firecrackers-a93nle.v2.appdeploy.ai/ . The production deployment of this main application source is recorded in [Cloudflare evidence](docs/evidence/cloudflare-production-2026-09-29.md).

Runtime checkpoint: `9f081db8cf3ca626febb9161ba74c907f9852e65`. Public verification checkpoint: `5b09b195f1f12c54566b3b7ad4339f7261a7f9d7`. Applied hosting snapshot: `1790640515766`. The final delivery and promotion documentation/CI changes do not retune those runtime modules. Promoting the already-published runtime does not require another deployment.

Cloudflare Worker `firecrackers` now serves the same build `2026-09-29.1` from canonical main `63dfff2fcc9e7d46a3b9a9c3f3185a188f92813e`. Its deployed version ID is `c2cbc9f9-e058-4220-9c27-dcd7d32bac9f`. The live release fingerprint is `615d4997ce54ce87812f4bb9b568f24d3057fa374d68f5692d8a74ebbcba4d1a`. The AppDeploy snapshot above remains the previous hosting record.

## Delivered

The original five Classics plus Aurora Crown, Ruby Dahlia, Sapphire Saturn, Phoenix Palm and Opal Supernova are implemented in both 3D and Canvas compatibility graphics. The new collection has authored shapes, distinct palettes and color aging, spatial branching, traveling secondary carriers, conservative child reservations and natural cleanup. Grand Collection/Classics navigation, ten keyboard shortcuts, per-collection session memory and persisted selected styles are integrated.

The repaired single-press launch, immutable active flight, duplicate prevention, manual takeover, pause/settings ownership, startup recovery, offline caching, protected/transparent output and readable manual deck remain intact. Ultra, the 60 fps target, sound-off startup and reduced-flash default are unchanged.

## Delivery issues closed

The earlier public build failed at 320×480 because compact CSS was overridden by import order, leaving only about 13 pixels of clear sky. The final selectors now leave about 77 pixels in the Grand layout and 68 pixels with the longer recovery message. Launch is hit-testable and 46 pixels tall. The test thresholds were not weakened.

The final public delivery run passed desktop and mobile, original workflows and recovery. The workflow attempts original-flow tests even if a collection test fails, avoiding an incomplete regression report. The source/dependency bundle, completion checklist and evidence are checkpointed in GitHub.

An earlier status answer overlooked push-triggered CI and relied on an outdated root status document. Live source inspection and all-event workflow results supersede that answer. The ten-effect version and compact fix were already deployed when the completion pass began, so no duplicate deployment was needed.

## Completed delivery validation

- Candidate run `36501591721`: engine/build, desktop, mobile and recovery jobs passed.
- Public run `36507918339`: source, desktop, mobile and recovery jobs all passed.
- 105 unit/engine/lifecycle/configuration tests passed; typecheck, lint and production build passed.
- 87 public-browser checks passed: 43 new-collection, 29 original launch/platform and 15 viewability/recovery checks.
- The public SHA-256 fingerprint matched all 35 normalized modules, with zero mismatches.
- A 7,200-second accelerated logical run completed with 1,317 launches and 2,875 bursts, bounded resources and no assertion failure.
- Actual public desktop, portrait, small-phone and landscape captures were reviewed. All five new silhouettes are visible and distinct.

These are the recorded delivery results. The new promotion checks must be read separately, not assumed to have passed from these historical results. Runtime validation now calls the full Grand Collection workflow for main changes and pull requests into main; the promotion workflow independently verifies ancestry and live source parity.

Unexpected application errors were absent in nominal delivery runs. Host-only preload warnings and two deliberately offline host requests are recorded separately. Injected graphics/interface faults belong to explicit recovery tests, not silent exceptions.

The [delivery record](docs/evidence/grand-collection-delivery.md) and [results JSON](docs/evidence/grand-collection-results.json) contain exact revisions, counts, artifacts, source parity and environment limitations.

## Qualification boundary

Physical Android/tablet, Safari/iOS, hardware WebGPU comparison, real-time graphics/thermal endurance, OBS composition, comprehensive flash/accessibility assessment and owner visual/audio approval remain open. These are not silently marked complete by Chromium emulation, a logical soak or promotion to main. Future higher-fidelity assets are separate scope; the requested five-effect expansion and its live delivery are complete.
