# Project status

Updated: 29 September 2026. Build: `2026-09-29.1`.

## Current delivery

**Grand Collection implementation and public preview verification are complete for the ten-firework expansion.** Continue on `feat/grand-collection`; do not resume the earlier five-effect recovery or V3 branch.

Live site: https://firecrackers-a93nle.v2.appdeploy.ai/

Runtime checkpoint: `9f081db8cf3ca626febb9161ba74c907f9852e65`. Public verification checkpoint: `5b09b195f1f12c54566b3b7ad4339f7261a7f9d7`. Applied hosting snapshot: `1790640515766`. Later documentation-only commits do not change the verified runtime. Main and other branches are preserved.

## Delivered

The original five Classics plus Aurora Crown, Ruby Dahlia, Sapphire Saturn, Phoenix Palm and Opal Supernova are implemented in both 3D and Canvas compatibility graphics. The new collection has authored shapes, distinct palettes and color aging, spatial branching, traveling secondary carriers, conservative child reservations and natural cleanup. Grand Collection/Classics navigation, ten keyboard shortcuts, per-collection session memory and persisted selected styles are integrated.

The repaired single-press launch, immutable active flight, duplicate prevention, manual takeover, pause/settings ownership, startup recovery, offline caching, protected/transparent output and readable manual deck remain intact. Ultra, the 60 fps target, sound-off startup and reduced-flash default are unchanged.

## Remaining delivery work closed

The earlier public build failed at 320×480 because compact CSS was overridden by import order, leaving only about 13 pixels of clear sky. The final selectors already present in the deployed snapshot now leave about 77 pixels in the Grand layout and 68 pixels with the longer recovery message. Launch is hit-testable and 46 pixels tall. The test thresholds were not weakened.

A fresh public run now passes both desktop and mobile, original workflows and recovery. The workflow also runs original-flow tests even if a collection test fails, avoiding an incomplete regression report. The source/dependency bundle, completion checklist and final evidence are checkpointed in GitHub.

The previous status answer overlooked push-triggered CI and relied on an outdated root status document. Live source inspection and all-event workflow results supersede that answer. The ten-effect version and compact fix were already deployed when this completion pass began, so no duplicate deployment was needed.

## Completed validation

- Candidate run `36501591721`: engine/build, desktop, mobile and recovery jobs passed.
- Public run `36507918339`: source, desktop, mobile and recovery jobs all passed.
- 105 unit/engine/lifecycle/configuration tests passed locally; typecheck, lint and production build passed.
- 87 public-browser checks passed: 43 new-collection, 29 original launch/platform and 15 viewability/recovery checks.
- The public SHA-256 fingerprint matched all 35 normalized modules, with zero mismatches.
- A 7,200-second accelerated logical run completed with 1,317 launches and 2,875 bursts, bounded resources and no assertion failure.
- Actual public desktop, portrait, small-phone and landscape captures were reviewed. All five new silhouettes are visible and distinct.

Unexpected application errors were absent in the nominal runs. Host-only preload warnings and two deliberately offline host requests are recorded separately. Injected graphics/interface faults belong to explicit recovery tests, not silent exceptions.

The [delivery record](docs/evidence/grand-collection-delivery.md) and [results JSON](docs/evidence/grand-collection-results.json) contain exact revisions, counts, artifacts, source parity and environment limitations.

## Qualification boundary

Physical Android/tablet, Safari/iOS, hardware WebGPU comparison, real-time graphics/thermal endurance, OBS composition, comprehensive flash/accessibility assessment and owner visual/audio approval remain open. These are not silently marked complete by Chromium emulation or a logical soak. Future higher-fidelity assets are separate scope; the requested five-effect expansion and its live delivery are complete.
