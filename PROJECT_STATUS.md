**Separately held integration candidate: cinematic shows + V4 (`2026-10-03.4`).** [Reconciliation and preserved release hold](docs/CINEMATIC-SHOWS-RECONCILIATION.md). Not a main promotion or deployment. Prior entries below are historical.

**Cinematic V4 candidate:** [docs/CINEMATIC-V4.md](docs/CINEMATIC-V4.md) records the realism/UX changes, deployment blocker and separate PR #33 hold. Candidate source is not a live-production receipt.

**Latest source work: richer night experience / `2026-10-03.2`, PR #45.** [Implementation, dependencies and qualification boundary](docs/RICHER-NIGHT-EXPERIENCE.md). Combines #37–#44's main-compatible features with #36. Exact promotion/check results are in PR #45. Draft #33 and its musical-score release hold are unchanged; no deployment is implied. The production receipts below remain historical evidence of the last actual deployment.

**Current production: `2026-10-02.3`** at [Firecrackers](https://firecrackers.mainandmany.com/). Always Play adds four quantity levels, explicit Start/Stop, smooth pace changes and immersive controls while preserving moonlit water and all thirteen effects. [Production receipt](docs/evidence/always-play-2026-10-02/PRODUCTION.md) · [controls](docs/evidence/always-play-2026-10-02/final/controls.html) · [PR #32](https://github.com/samir1234khans/firecrackers/pull/32). Complete PR/main CI and public functional checks passed. Sustained new-mode performance remains unqualified after owner-shortened testing and rejected shared-hardware timings; physical devices/Safari/thermal/flash conformance remain unqualified. Earlier release entries below are historical.

**Previous production: `2026-10-01.11`** at [Firecrackers](https://firecrackers.mainandmany.com/), from clean main `dd62559` / [PR #31](https://github.com/samir1234khans/firecrackers/pull/31). Moonlit swells, planar reflections, hull contacts and damp coping preserve all thirteen effects. Calm/Festival/Finale offer smooth immersive controls. PR/main CI, 244 units, 456 public checks, four native startup scenarios and documented component performance qualification passed. Previous Worker retained for rollback; physical phones/Safari/thermal endurance remain unqualified. [Production receipt](docs/evidence/moonlit-water-2026-10-01/PRODUCTION.md) · [preview](https://firecrackers-moonlit-preview.allygym-api.workers.dev/) · [matched captures](docs/evidence/moonlit-water-2026-10-01/final/comparisons.html).

The candidate/release entries below preserve earlier checkpoints and are superseded by this receipt.

**Latest candidate:** [build `.11` qualification](docs/evidence/moonlit-water-2026-10-01/FINAL-QUALIFICATION.md) records the implemented water and immersion changes, final preview and remaining release gates. Production remains `.4`.

**Immersive shows:** Calm, Festival and Finale now offer an opt-in toggle that smoothly hides every ordinary control, leaving one Show controls button. [Implementation and verification](docs/evidence/moonlit-water-2026-10-01/IMMERSIVE-UI-IMPLEMENTATION.md). Production remains unchanged.

# Moonlit water candidate

[PR #31](https://github.com/samir1234khans/firecrackers/pull/31) implements the [next water graphics phase](docs/evidence/moonlit-water-2026-10-01/PLAN.md), build `2026-10-01.11`, on a branch synchronized with main's reconciliation receipt. The [isolated preview](https://firecrackers-moonlit-preview.allygym-api.workers.dev/) adds shared geometric waves, scene-directed moonlight, bounded planar reflections, sampled hull contacts and damp coping. [Qualification evidence](docs/evidence/moonlit-water-2026-10-01/PREVIEW.md) retains actual results and performance limits. Production is unchanged.

# Previous production: all latest work reconciled

Build `2026-10-01.4` is live at [production](https://firecrackers.mainandmany.com/) from clean canonical source main `8b491d2528b251d9e57d7326ba5ea42e36fbb271`. The moon/water, thirteen effects, open-sky controls, responsive rocket support, moon-led startup and burst-stall fix are included. Worker `57796211-f2a8-4fc1-8381-4c9235bfb5bd`; source/artwork fingerprint `965c6eaa6ebd5aef2f5922831504a6bbe1c3879e24a26532432af279f5e09d51`.

[Production verification and 64-ref reconciliation](docs/evidence/latest-production-2026-10-01/PRODUCTION.md) records CI, public tests, retained branches and rollback. At that reconciliation snapshot, every then-current development branch was represented in main; the new moonlit-water candidate above remains a separate PR. The historical five-effect JavaScript implementation remains preserved as an alternate, with no missing current-runtime capability found. The [isolated `.4` preview](https://firecrackers-burst-preview.allygym-api.workers.dev/) remains available. Physical phones, Safari, real OS zoom and sustained GPU/thermal performance remain unqualified.

# Previous production: bottom collection and upper canopy

Build `2026-09-30.8` is live at [production](https://firecrackers.mainandmany.com/) from source main `585d82e5aa135cf6f6ef7729b81a6f40f8798ef9`, merged [PR #24](https://github.com/samir1234khans/firecrackers/pull/24). Worker `5a577d62-1deb-4770-b780-784d03574c7a`; exact 66-module fingerprint `5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535`. The [isolated preview](https://firecrackers-redesign-preview.allygym-api.workers.dev/) delivers the same source. [Production receipt](docs/evidence/bottom-collection-2026-09-30/PRODUCTION.md), [matched captures](docs/evidence/bottom-collection-2026-09-30/comparison.html) and [implementation](docs/evidence/bottom-collection-2026-09-30/IMPLEMENTATION.md) record the completed release.

All ten icons now launch from the bottom; compact Pause/Sound/Controls sit on the right and all panels share translucent styling. Tap and sky/terrace drag behavior, upper-sky profiles and immutable airborne trajectories are implemented. 154 units, required PR/main push CI, 427 production browser checks, 29 exact HTTP/assets checks and two native default-startup/Festival cases passed. Initial startup/timing failures and their resolution are retained in the receipt; no unresolved test failures remain. Physical phones/Safari, real safe areas/browser bars/OS zoom and sustained GPU/thermal performance remain NOT TESTED. Previous `.7` Worker remains available for rollback. Canonical main contains the shipped source; prior branches and release history are preserved.

# Previous release: Waterfront v008

## Previous production: Waterfront v008

Build `2026-09-30.7` was deployed at [Firecrackers](https://firecrackers.mainandmany.com/) from source-main `947f0c57e679a34d35e00b550aae625eba845672` / [PR #23](https://github.com/samir1234khans/firecrackers/pull/23), Worker `e167225e-e463-41f6-897d-e6f5b59aa03c`. Exact 62-entry fingerprint: `6186a504d1ccf20d90434ffe90b5771f075e33992765d9dbfa6d636e376c602b`.

The far-bank village stays attached to the desktop/tablet horizon, the original Blender stone quay fills the foreground, and the CC0 canoe-derived boats gain woven shelter detail, two seated silhouettes, restrained contact/wakes and improved scale/lighting. All ten effects and the compact transparent interface remain. [Production receipt](docs/evidence/waterfront-realism-2026-09-30/PRODUCTION.md), [public before/after gallery](docs/evidence/waterfront-realism-2026-09-30/comparison.html), [plan](docs/evidence/waterfront-realism-2026-09-30/PLAN.md), and [implementation/provenance](docs/evidence/waterfront-realism-2026-09-30/IMPLEMENTATION.md).

144 units, PR and source-main CI, 172 hosted preview checks and 178 public production checks passed, plus a fresh default WebGPU/Ultra 60-second Festival run. Physical phones/Safari, thermal endurance, completed GPU-frame timing and photographic parity remain unqualified. Previous `.6` Worker is retained for rollback; earlier sections below are historical.


## Previous production: Transparent panels

Build `2026-09-30.6` was deployed from app-source main `ed54fe640945fa7de0f4ba3546b3445348bde78b`, merged [PR #22](https://github.com/samir1234khans/firecrackers/pull/22), Worker `d04c14f1-f219-45dd-989e-97569693ac4b`. Its 60-entry fingerprint is `1249e82e8ab6604c52d7c32002a939792e3a9724bcd4fb7fe34e5d0d183fafe0`. Every opened panel/loading/recovery surface now shares compact translucent styling. [Production receipt](docs/evidence/transparent-panels-2026-09-30/PRODUCTION.md), [per-surface plan](docs/evidence/transparent-panels-2026-09-30/PLAN.md), [UI gallery](docs/evidence/transparent-panels-2026-09-30/review.html), and [actual WebGPU panels](docs/evidence/transparent-panels-2026-09-30/hardware-captures/README.md). Final PR CI and source-main CI each passed all four jobs. All 353 public checks passed: panels 195, native hardware 56, Grand 42, original launch/offline 28, recovery 15 and HTTP/source/assets 17. A separate fresh automatic WebGPU/Ultra 60-second Festival observation passed with zero errors. The prior `.5` Worker is retained for rollback. Physical Android/iPhone/Safari, thermal endurance and completed GPU-frame timings remain unqualified.

## Previous production: Interactive galactic sky

Build `2026-09-30.5` is live from main `1648786955a3af10e60f99807236d1676bad6284`, merged [PR #21](https://github.com/samir1234khans/firecrackers/pull/21), Worker `a79b4a3d-89ac-418e-b487-60433885219d`. Its 58-entry source/asset fingerprint is `81bf4e1160df0f21a10e29b04c9b1428128dc44be16216e1fe3a4352c06242c7`. Original native sky layers, gentle pointer/touch response and a faint scheduled meteor are delivered. Final PR CI `36712448955` and main runtime CI `36713664345` passed all four jobs; main documentation CI `36713664018` passed. [Production receipt](docs/evidence/interactive-galactic-sky-2026-09-30/PRODUCTION.md) records public qualification and `.4` rollback. [Matched browser comparison](docs/evidence/interactive-galactic-sky-2026-09-30/comparison.html) distinguishes actual website captures from image-generation studies.

The galactic `.5` Worker is the retained rollback for the transparent-panel `.6` release. Physical-device and completed-GPU-frame performance evidence remains separate from desktop browser qualification.

## Previous production: Living river and candlelit boats

Build `2026-09-30.4` is live from main commit `edbc0acc4024e334b05334d978baeb51dc0a7045`, merged [PR #19](https://github.com/samir1234khans/firecrackers/pull/19), Worker `534323b7-e2e8-4935-a161-b86bdfb3f2b0`. Its 56-module source/asset fingerprint is `dc781d21e50e6fe2680e55b1fbf3a47ec8e72b605e349b876beeecaf388b5609`. Three real textured CC0 canoe adaptations, the larger covered candle boat, twelve clustered homes, bounded practical reflections and the native celestial sky are shipped alongside the prior cinematic scene. Main runtime CI `36705577730` passed all four jobs; documentation CI `36705577354` passed. Public hardware 33, Grand Collection 42, original workflows 28, recovery 15 and HTTP/source/assets 17 total **135 successful checks**. [Current production receipt](docs/evidence/living-river-2026-09-30/PRODUCTION.md) preserves exact reports, the first screenshot-timeout attempt and unchanged successful retry, analytics-only aborted requests, and rollback to `.2` Worker `2bd3e2bd-c4bb-418b-9ca6-ce11ebef9d5a`.

Actual installed Chrome on this PC verifies native WebGPU and WebGL (Intel `gen-12lp` / UHD Graphics 770). Portrait/touch and tablet views are emulation; software/headless suites are separately identified. Physical Android/iPhone, Safari, thermal/endurance and completed GPU-frame performance targets remain unqualified. Earlier release sections below are historical.

## Previous production: Cinematic realism

Build `2026-09-30.2` was live from main commit `9debc8914a6428b0d2ef005674de0214526ed9ca`, Worker `2bd3e2bd-c4bb-418b-9ca6-ce11ebef9d5a`. Its 53-entry fingerprint `33b9adcc18a310caad61077fd479dbee09ac77fad98fb48c11534c1af90b57a0` matches the retained cinematic preview. Original generated scenery, Blender v005 smoke and water maps, continuous TSL trails and reflection/material refinement were deployed. PR and main runtime CI passed all four jobs. Public hardware WebGPU six, Grand Collection 42, original launch/offline 28, recovery 15 and HTTP/source/asset 16 checks passed. [Historical production receipt](docs/evidence/cinematic-realism-2026-09-30/PRODUCTION.md) records rollback and qualification boundaries; [comparison viewer](docs/evidence/cinematic-realism-2026-09-30/comparison.html) shows matched browser evidence. Physical phone/thermal targets and photographic parity remain unqualified.

## Previous production: WebGPU startup repair

Build `2026-09-30.1` is live from main commit `f10a441896fc5f41f1965759f3d5e9e2bdee900b`, Worker `d5143fe3-0290-44b2-ac2d-bff384963d33`. It fixes interleaved buffer limits and immutable texture sizing, adds same-quality recovery through WebGL, and exposes active-renderer controls. [Production receipt](docs/evidence/webgpu-production-release-2026-09-30.md) records release CI, actual hardware WebGPU and rollback; [graphics roadmap](docs/evidence/webgpu-startup-2026-09-30.md) records next Three.js/TSL/Blender work. Older release sections below are historical.
## Previous production: Graphics recovery

Build `2026-09-29.6` was live at [Cloudflare production](https://firecrackers.mainandmany.com/), now Worker version `9d06f53e-0584-415d-8d4d-41beedfa4a04` after the [branch reconciliation and clean-main republish](docs/evidence/branch-reconciliation-2026-09-30.md). The application source originated in main commit `9ff7d5fe901a7815b658337b1150ed443a1a0313` and PR #12; the republished clean main was `5353c7100ea813ee8f83e6c72acc5fe207acc8f7`. Its 50-entry fingerprint `e05400864811cb02531e7dfa4a4de24c52106c6b92b4ec908392a6f5e7261534` matches the [retained preview](https://firecrackers-graphics-preview.allygym-api.workers.dev/). Art loads independently; repeated severe renderer stalls switch to Canvas while preserving the active simulation and saved quality. [Original production evidence](docs/evidence/graphics-recovery-production-release-2026-09-29.md) records the preceding deployment; the new reconciliation receipt records the current Worker and public checks. The [earlier `.5` diagnosis](docs/evidence/graphics-loading-diagnosis-2026-09-29.md) reproduced a software-WebGL freeze with all art assets loaded; the owner's physical-device cause and performance remain unverified.

## Previous production: Placed drag launch

Build `2026-09-29.5` was live at [Cloudflare production](https://firecrackers.mainandmany.com/), Worker version `0dd30a40-e7ca-41b1-8723-0bbe6574bcbe`, from main commit `b8174710651dc7424a75551f93bfe317955cdf57` and PR #10. Its 50-entry source/asset fingerprint is `36bebaa351ce233d0c8bab75e57a4cdaa33a587ab977edda5854116c3796034d`, matching the [retained isolated preview](https://firecrackers-pad-preview.allygym-api.workers.dev/). Firework and Launch icons are borderless; the selected quick Launch stays visible; the next rocket appears immediately after the burst; and a terrace-height drag drop starts a normal rocket from the chosen horizontal position while a sky drop bursts immediately.

[Production evidence](docs/evidence/pad-launch-production-release-2026-09-29.md) records public Chromium stage 34, Grand Collection 42, original flow 28 and recovery 15 checks with zero application errors, plus CI, screenshots and rollback. [Preview evidence](docs/evidence/pad-launch-preview-2026-09-29.md) records 125 unit tests and a 7,200-second logical soak. The prior `.3` Worker version `5c39c81a-6b79-49ae-bf50-007a93ee83f6` remains available for rollback.

## Previous production: Waterfront realism refinement

**The previous production build was `2026-09-29.3`.** Worker version `5c39c81a-6b79-49ae-bf50-007a93ee83f6` served merge commit `e1789db3e4c28cd8f8f55662d7b3e9ec7f6034f6` from PR #7. Its preceding `.2` Worker version was `204d3c26-6c11-485b-9137-2b59a647ad0e`.

That release added the Blender v004 terrace, improved waterline/reflection composition and corrected smoke-atlas family selection. At the time, production and [the retained preview](https://firecrackers-realism-preview.allygym-api.workers.dev/) served the same SHA-256 fingerprint `4ae7b48094bad269c0a47655d5d20e6839b71f593100aa052d90e4df63a6a40d`. Main push CI passed all four runtime jobs and documentation validation. Public stage checks passed 22, Grand Collection and original flows passed on desktop/mobile, recovery passed 15, and an offline enhanced-asset reload succeeded. See [the production receipt](docs/evidence/realism-production-release-2026-09-29.md) and [the image-guided comparison record](docs/evidence/realism-refinement-2026-09-29.md).

Physical iPhone/Android performance, Safari and hardware WebGPU are not established by these browser runs.

## Previous waterfront release

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

## Earlier candidate checkpoint — 30 September

Build `2026-09-30.1` fixes two reproduced WebGPU startup defects. Local hardware Chrome and compatibility checks passed; production promotion and public checks are recorded at the top of this status. See [evidence and roadmap](docs/evidence/webgpu-startup-2026-09-30.md).

## Earlier cinematic candidate checkpoint

Before release, build `2026-09-30.2` followed the original generated photographic studies as a candidate. Atmospheric scenery, original smoke v005 and continuous TSL trails were integrated while matched hardware captures and visual refinement ran. [Plan](docs/evidence/cinematic-realism-2026-09-30/PLAN.md). The production receipt at the top now supersedes this checkpoint.
