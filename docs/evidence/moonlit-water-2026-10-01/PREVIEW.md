**Released:** build `.11` is live. [Production, main reconciliation, public checks and rollback](PRODUCTION.md) supersede the checkpoint below, which remains as history.

**Latest implementation: build `.11`.** See [final qualification](FINAL-QUALIFICATION.md) for current source, isolated preview, checks and pending release gates. The receipt below preserves its historical checkpoint.

> Latest isolated preview: build `2026-10-01.9`, fingerprint `8c683a81…c33d7d63`, Worker `88affdd1-2ab9-4272-82e6-1443a994a87a`. [Final qualification](FINAL-QUALIFICATION.md) records current implementation, hosted checks, comparisons and retained performance failures. The material below preserves earlier candidate receipts.

**Latest candidate: `2026-10-01.6`.** The immersive automated-show toggle is implemented and published to the same isolated preview. [Current implementation, 105 hosted cases/checks and performance qualification](IMMERSIVE-UI-IMPLEMENTATION.md) supersedes the `.5` deployment details below; the earlier evidence remains retained. Current performance still misses three pooled frame conditions and three transition conditions. Production remains `.4`.

# Moonlit water — isolated preview receipt

The [moonlit preview](https://firecrackers-moonlit-preview.allygym-api.workers.dev/) serves the implemented water phase and a startup resize guard from [PR #31](https://github.com/samir1234khans/firecrackers/pull/31). The current guard artifact's hosted functional checks pass; earlier local graphics checks and performance measurements retain their original source identity. Performance qualification remains conditional and headed full-window Chrome qualification is pending. **Production is unchanged.** The [approved plan](PLAN.md), [implementation guide](IMPLEMENTATION.md), [comparison gallery](COMPARISONS.md) and [performance receipt](PERFORMANCE.md) describe the review scope and remaining limits.

## Verified source and deployment

Current runtime source: `cde1c979b8684cfc7c2e489d7c64b061f8e8bb43`, on `codex/moonlit-water-realism`. The graphics implementation checkpoint is `3f4b8bf8a729db44510b77b2a08c04a0b83bb851`; the scalar performance test checkpoint is `e76c81649e79840dd48492af64ff72aad34cb277`. The branch includes reconciled main `3f4dc270e39471643ec707894bc56858608c6a93`, whose application baseline is `8b491d2528b251d9e57d7326ba5ea42e36fbb271`.

The current preview is build `2026-10-01.5`, with **82** normalized delivered modules and fingerprint `9edb9bec2c39caa1e0a7d228cc4970e5652a629417115d290a0c9c7e0e5df2a2`. Its Worker version is `39b95ec9-f52c-4d51-8df4-f355b0cee26b`; its configuration has no production route. Hosted checks verify this deployment's fingerprint and exact delivered asset bytes. The preceding graphics artifact had fingerprint `3875eec75b2ff8a4021eebbb32bc19845d89d0a68c82b3f58ac3ab669e0db7e2`, Worker `49f39f13-3f31-4b23-bb0c-ce57f3433b17`.

Production remains `2026-10-01.4`, fingerprint `965c6eaa6ebd5aef2f5922831504a6bbe1c3879e24a26532432af279f5e09d51`, Worker `57796211-f2a8-4fc1-8381-4c9235bfb5bd`. The hosted HTTP receipt also verifies production's unchanged release identity. No merge to main or production promotion occurred in this phase.

## Implementation and evidence scope

The scene retains its composition, authored scenery, three boats and all thirteen firework identities. Water uses bounded shared geometric waves and analytic slopes, wind-integrated fixed-clock phase, camera-directed broken moonlight, low-frequency sky illumination and source-aligned clipped planar reflection. Four-point hull sampling, interrupted wave-conforming immersion/contact marks, actual moving lantern anchors and a narrow damp coping finish the contacts. Canvas uses the same wave phase with bounded perspective approximations.

The mirror has one cropped water-band target, four instanced scenery-proxy draws and twelve conservatively culled particle batches. Ultra/Standard target-edge caps are 512/256 px. Desktop updates are bounded to 30/15 Hz; portrait updates to 15/10 Hz. Low and transparent modes allocate no target. Camera projection, clipping and renderer state are restored after the pass; material variants warm before launches. Resource and backend details are in the [implementation guide](IMPLEMENTATION.md).

The startup guard changes only `useWorld` initialization/resize timing: diagnostics and renderer resizing wait for preparation to finish, then initialization replays the latest viewport. It does not change steady-state water shaders, firework choreography or rendering budgets.

Current guard-source unit/lint/build checks pass: **241 unit tests**, TypeScript lint, production build and high-severity dependency audit (one known low-severity finding remains). The [native headless startup experiment](hosted/startup-guard-native.json) covers four candidate/baseline cases at **1623×921 CSS pixels, DPR 1.375**, without QA mode. Candidate natural startup and twelve resizes before readiness both produce zero alerts and no Gold Willow fallback. The resized baseline reproduces the transient alert and recovers. This is startup evidence; it does not establish headed-window performance.

Current guard-artifact reruns pass: **32 hosted HTTP**, **52 hosted native**, **15 software viewability/recovery** and **2 offline/context recovery** checks. Their current reports are retained below. The local native receipt remains explicitly tied to the preceding `3875eec…` graphics artifact.

| Evidence and source boundary | Result and scope |
| --- | --- |
| Unit, TypeScript lint and production build | **241 unit tests pass**; lint and build pass. Numerical coverage includes waves/derivatives/bounds/attenuation/phase, both clip conventions and cropped projection, conservative particle bounds, target lifecycle/rates and renderer-state restoration. |
| [Local native browser receipt](native/report.json), preceding `3875eec…` | **52 checks pass**, zero errors. Native Intel WebGPU and WebGL driver identities are checked independently; Canvas is tested separately. This receipt does not claim a new local run on `9edb9bec…`. |
| [Hosted native browser receipt](hosted/native.json), current `9edb9bec…` | **52 checks pass**, zero errors. Seven emulated viewport sizes from 320×480 through 1920×1080; shared wave/hull/contact/proxy bounds, pause/controlled visibility, tiers, independent motion/flash controls, transparency and missing normal art. |
| [Hosted HTTP receipt](hosted/http.json), current `9edb9bec…` | **32 checks pass**, zero errors: delivered assets, release identity, root document and unchanged production. |
| [Hosted software viewability/recovery](hosted/viewability.json), current guard artifact | **15 checks pass**. This is compatibility and recovery evidence, separately from native hardware graphics qualification. |
| [Hosted offline/context recovery](hosted/offline-context.json), current guard artifact | **2 checks pass**: actual service-worker cold offline reload with three complete Signature effects, and actual WebGL context loss followed by explicit Canvas recovery and realtime Signature replay. |
| [Matched comparisons](COMPARISONS.md), current `9edb9bec…` | **15 after-captures** at matching seed/time/quality/backend for idle, Gold Willow, Sapphire Saturn, Opal Supernova and Imperial Crown; deterministic visual evidence rather than performance measurements. |

Controlled hidden-page tests use a `document.hidden` override and visibility event; they do not establish OS background endurance. Phone viewports and touch are emulated on this PC. Physical-phone performance, Safari, sustained thermal behavior and completed GPU timing remain unqualified.

## Performance and remaining qualification

The completed scalar experiment measures fingerprint **`3875eec…`**, not the current startup guard fingerprint **`9edb9bec…`**. It completes **24 counterbalanced runs**, with zero runtime errors or source/backend/quality/probe mismatches. All **18 pooled app-cadence conditions** and **12 applicable burst transitions** pass the unchanged `max(2 ms, 20%)` allowance under both floor-index and nearest-rank p95. Repeatable new rendered-transition stalls over 50/100 ms do not appear in both repetitions. No full 24-run performance qualification is claimed for the startup guard artifact.

There are still **three individual paired app-budget misses**, **four pooled secondary rAF condition groups** with failures, and script exit **1**. Desktop WebGPU launch 1 CPU-submission p95 increases **6.2 → 12.6 ms**, reducing headroom. Desktop Canvas cadence remains slower and variable. Pooled passes do not erase paired failures. The [performance receipt](PERFORMANCE.md) gives exact conditions, limits, method and preserved historical failures; this candidate has no unconditional performance pass.

A headed full-window Chrome session initially recorded a resize error which cleared, followed by a Gold Willow launch causing slow-frame Canvas fallback. Its DOM loaded cached entry `./assets/index-BjHv05gK.js`, which matches neither preceding `3875eec…` entry `index-4RuMP_Hb.js` nor current `9edb9bec…` entry `index-D5QjFzoE.js`. The exact older cached source is unidentified, so this observation cannot be attributed to either measured artifact. Using the normal **Controls → Settings → Device → Update app and restart** action then loaded `index-D5QjFzoE.js`, matching the current deployment.

Repeating Gold Willow on that current bundle also triggered Canvas recovery in the browser-control session; production `.4` then did the same. Both scenes remained playable with no unexpected console errors. These uncontrolled observations do not attribute the fallback to the water change or establish normal foreground-window performance. Viewport height changed during this session; source, dimensions, saved preferences and limitations are recorded in [the manual inspection](hosted/MANUAL.md). The guard's fresh native headless full-DPI cases retain WebGPU. Headed foreground-window qualification remains open; no recovery threshold or browser flag was changed to obtain a pass.

The [raw evidence archive](measurements/raw-experiments.zip) retains 100 entries, including timing reports, failed experiments and diagnostic traces; archive integrity was verified. It is 28.45 MB with SHA-256 `01e57020c83aefd7d10c38a2c06331f3cd070052c5f18478813f2d6f09ad75e6`. Traced MajorGC attribution is limited to reproduced traced gaps; observer, scheduling and projection changes were not isolated experimentally.

## CI and release state

Earlier source `141b6ce` passed the complete four-job [runtime CI run 36866328137](https://github.com/samir1234khans/firecrackers/actions/runs/36866328137). This is historical evidence, not proof of final-head CI. The current head and required check state are authoritative on [PR #31](https://github.com/samir1234khans/firecrackers/pull/31).

The preview is available for review with the limits above. Headed-window qualification and strict performance misses remain open; use the PR's live checks for current CI state. Production promotion requires the repository's main/release gates, applicable authorization and the retained production Worker for rollback.

The owner also requested a **plan-only** immersive show-mode UI addition: an explicit way to hide the chrome except for a smoothly transitioning show/hide control during a non-manual show. [The immersive UI plan](IMMERSIVE-UI-PLAN.md) records the interaction and acceptance contract. This addition is planned and is not implemented in the water preview.
