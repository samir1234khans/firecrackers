**Latest source work: richer night experience / `2026-10-03.2`, PR #45.** [Implementation, dependencies and qualification boundary](docs/RICHER-NIGHT-EXPERIENCE.md). Combines #37–#44's main-compatible features with #36. Exact promotion/check results are in PR #45. Draft #33 and its musical-score release hold are unchanged; no deployment is implied. The production receipts below remain historical evidence of the last actual deployment.

Latest production: [moonlit water and immersive controls / build `.11`](docs/evidence/moonlit-water-2026-10-01/PRODUCTION.md) records the owner-authorized main promotion, passed qualification, actual deployment and rollback. Earlier candidate/release entries below are historical.

Latest water/immersion qualification: [build `.11` receipt](docs/evidence/moonlit-water-2026-10-01/FINAL-QUALIFICATION.md). Reflection rates are bounded at Ultra 15/12 Hz and Standard 15/10 Hz (wide/portrait). Qualification and release state in that receipt supersede earlier candidate settings below.

# Development workflow

## Source and branches

**Main is the canonical thirteen-effect application baseline after the owner's authorized promotion.** The source incorporates `feat/grand-collection`, the repaired `fix/viewability-recovery` and `fix/video-launch-flow`, ignition reliability and the cinematic V3 work. Those branches remain historical references. The separate `feat/fireworks-v1-implementation` is a competing older implementation, not a missing current-runtime update.

Start new feature/fix branches from freshly fetched main and use pull requests back to main. Continue an explicitly authorized task branch when appropriate. Do not reset unrelated work, force-push or delete branches. A ref conflict requires refreshing and reconciling, not force. The current main promotion is owner-authorized; future merges, domain changes and public licensing still require their applicable review/authorization.

Commit coherent source, tests and documentation together. Explain changed behavior and actual evidence. The original five-effect/hold-ignition specifications remain historical; later owner-approved ten-effect and single-press decisions take precedence as documented in the current plan and evidence. See [the main promotion audit](docs/evidence/main-promotion.md) for source-history reconciliation.

Current production also includes moon/water, the three Signature effects, open-sky controls, responsive launch support, moon-led startup and stable scene lighting through launches. [Latest reconciliation and release](docs/evidence/latest-production-2026-10-01/PRODUCTION.md) supersedes older release identifiers and layout descriptions below.

## Reproduce the application

Use Node `.nvmrc` and `npm ci` with the committed lockfile. Avoid unrelated dependency upgrades. Never commit dependency directories, generated builds, private machine settings or secrets.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:soak
```

The logical soak is accelerated simulation, not hardware GPU/thermal endurance. Run the same input/seed workloads for comparable visual evidence. A successful build alone does not establish correct graphics.

## Browser validation

Install the configured Chromium runtime and serve the actual production build before using the browser scripts:

```sh
npx playwright install chromium
npm run preview -- --port 4173
```

In another process:

```sh
npm run test:stage
npm run test:grand
npm run test:e2e
npm run test:viewability
```

The Grand script supports `GRAND_PROJECT=desktop` or `mobile` and `GRAND_URL`. The original-flow script supports `VIDEO_FLOW_PROJECT` and `VIDEO_FLOW_URL`. The recovery script supports `VIEWABILITY_URL`. Defaults target loopback port 4173. Use the public URL only when deliberately verifying the deployed website.

For independent art-loading and live overload recovery, run `node tests/assets-browser.mjs` and `node tests/overload-browser.mjs`. Use `ASSET_URL` and `OVERLOAD_URL` to target an isolated preview. The overload suite injects three slow-frame samples through the `?qa=1` test interface, then verifies the real renderer handoff, active flight, pause, show mode and drag coordinates. The reusable recovery CI job runs both suites against the exact production build artifact.

Grand validation covers new recipes, both rendering modes, collection browsing and saved selection, ten shortcuts, child pause/cleanup and small layouts. The stage suite covers the bottom collection/right rail layout, tray drag, pause/focus ownership, audio activation and reflection budgets. The original suite protects launch, duplicate rejection, next selection, pause, takeover, preferences and offline/platform behavior. Recovery tests inject missing modules, unavailable/lost graphics and interface failures. Do not remove these guards to simplify an expansion.

`Runtime validation` runs for application/configuration changes pushed to main and for pull requests into main. It calls the complete reusable `Grand collection validation` workflow, which builds once and serves that exact artifact for separate desktop, mobile and recovery jobs. The workflow can also be dispatched manually. Relevant unit, audit, build and logical-soak gates remain included; duplicate unit invocations in the older runtime workflow are unnecessary because `npm test` includes those suites.

GitHub workflows separate candidate build tests from actual public-site verification. Read explicit job results and all event types; the PR-only commit helper is insufficient for push-triggered checks. Inspect failed logs and actual screenshots before repairing. Keep the original-flow step running even when a new-collection check fails.

## Deployment and source parity

Cloudflare production uses Worker `firecrackers` with the static `dist/` bundle and `firecrackers.mainandmany.com` custom domain in `wrangler.jsonc`. After testing a clean release candidate with the pinned Node version, run `npm run cloudflare:deploy`. Confirm the returned Worker version, domain response, `/release.json` fingerprint, PWA files, and public browser behavior. Keep the previous version ID for rollback. The first release is documented in [Cloudflare evidence](docs/evidence/cloudflare-production-2026-09-29.md).

The existing AppDeploy app `firecrackers-a93nle` and its published URL remain as a separate preview and historical source-parity target. Inspect applied source before updating it; send only changed files and preserve hosting/PWA/recovery configuration. If the corrected source is already applied, do not redeploy just to repeat a checkpoint. Promoting already-published source to main is not a separate runtime deployment.

`npm run build` writes `public/release.json`. The historical AppDeploy verification compared 35 normalized modules with GitHub. Current waterfront releases fingerprint the delivered source modules and binary art/audio assets; local build `.3` reports 49 entries. The pinned TypeScript canonicalizer excludes only known static host diagnostic labels; non-JSX code remains byte-exact after newline normalization. Meaningful source changes must not be normalized away. This scope is not an assertion that the entire host wrapper or site is identical.

The initial `Main promotion verification` workflow confirms the approved historical heads are ancestors of main and compares the promoted source fingerprint with the live preview. It is not an automatic publisher. Normal changes must still complete their own test/deployment/verification cycle.

Run public Grand, original-flow and recovery suites after a runtime deployment. Record source SHA, applied snapshot, build version, parity timestamp, artifact IDs and real outcomes. Keep rollback references. Do not state hardware, OBS or accessibility qualification from emulated tests.

## Documentation

```sh
python -m pip install -r scripts/requirements-docs.txt
python scripts/validate_docs.py
```

Update README, PROJECT_STATUS, the documentation index and current evidence after delivery. Preserve historical plans and failed-then-fixed findings. Structural validation is not a browser or art review. Generated evidence can live in Actions artifacts with stable identifiers and report hashes; retain important reports before artifact expiry.

## Waterfront and drag-to-burst contracts

`StageLayout` measures the right rail, always-reserved tray, safe insets, unobstructed scene, terrace drop region, burst canopy and reflection band. Both renderer backends consume this contract. Do not restore camera framing based on the removed bottom deck. `Simulation.burstAt` uses the same bounded admission and deterministic family generation as normal launch. Drawer drag commits only on a valid release; overlay pause ownership and an existing committed flight must remain intact.

Build `.5` adds a terrace-height drop band across the safe viewport. `useWorld.dropTarget` returns either a sky burst point or a projected launch placement, and `drop` dispatches through `burstAt` or `igniteFamily` respectively. `StageLayout` reserves adjacent quick-action width even while hidden, so hover/focus cannot move the camera; actual visible controls reject drops. A valid pad drop follows the normal fuse and flight. The next pad prop and launch readiness appear immediately at burst start when capacity permits; an active fuse/flight and the particle budget still reject duplicate admissions. The retained isolated preview uses `wrangler.pad-preview.jsonc` and is documented in [its preview evidence](docs/evidence/pad-launch-preview-2026-09-29.md); [production evidence](docs/evidence/pad-launch-production-release-2026-09-29.md) records public checks and rollback.

Run `npm run test:stage` against a production build, or set `STAGE_URL` to the preview origin. This verifies the seven requested viewport sizes, touch drag, focus restoration, pause ownership, audio opt-in and reflection budgets.

Blender masters and reproducible scripts live under `assets-source/blender/`; see asset provenance before regenerating. Raw projects are excluded from `dist`. The release fingerprint includes delivered source modules and public art/audio binaries.

To publish a separate reviewed preview after building, run `npx wrangler deploy --config wrangler.preview.jsonc`. Production uses `wrangler.jsonc`. Retain the previous Worker version from the release receipt for rollback. Do not equate emulated browser tests or accelerated logical soaks with physical-device performance qualification.

The graphics recovery candidate uses `npx wrangler deploy --config wrangler.graphics-preview.jsonc`, which has no production route. Compare its `/release.json` SHA-256 with the local build before changing the custom domain.

## Realism refinement source and review

Build `.3` has [local candidate evidence](docs/evidence/realism-refinement-2026-09-29.md) that pairs production `.2` and local `.3` at identical seeds and logical times for Willow, Saturn and Supernova. Treat those WebGL 2 captures as composition evidence; generated concepts under `docs/evidence/realism-refinement/concepts/` are target imagery, and neither source establishes real-time device performance. The current release fingerprint includes the new `terrace-v004.glb`; the v003 export remains under `assets-source/blender/exports/` for history.

The editable terrace is regenerated from the preserved v003 master using Blender 5.2.1:

```sh
blender --background --factory-startup --disable-autoexec assets-source/blender/masters/waterfront-v003.blend --python-exit-code 1 --python assets-source/blender/refine_terrace.py
blender --background --factory-startup --disable-autoexec assets-source/blender/masters/waterfront-v004.blend --python-exit-code 1 --python assets-source/blender/verify_terrace.py
```

The first command writes a new v004 master, packed 256-pixel basalt atlases and a terrace-only GLB. The second reopens that master, reimports the GLB and writes `assets-source/blender/verification-v004.json`. Review the browser asset at desktop and portrait sizes because a valid GLB does not prove correct scene scale, horizon position or reflection energy. Preserve the bottom collection and right rail and all ten seeded effects when tuning the scene.

## Hardware WebGPU qualification

Run `node tests/webgpu-browser.mjs` with installed Chrome and a real GPU. Set `WEBGPU_URL` to the candidate or public origin; default is port 4180. This headed opt-in test rejects fallback adapters and WebGL masquerading as WebGPU, checks asset activation and effects, and verifies recovery. It is separate from CI software-renderer evidence. See [repair and next graphics work](docs/evidence/webgpu-startup-2026-09-30.md).

## Cinematic comparison capture

`node tests/cinematic-browser.mjs test-results/cinematic-candidate` captures hardware WebGPU and WebGL at desktop and portrait viewport sizes. Set `CINEMATIC_URL` (default port 4180) and `CINEMATIC_PREFIX`. It resets each independent seeded launch to time zero and records early/peak/late frames, actual backend, asset states, cleanup and short real-time rAF/submission cadence. Portrait is emulation and cadence is not GPU completion or thermal endurance. [Implementation plan](docs/evidence/cinematic-realism-2026-09-30/PLAN.md).

## Celestial sky qualification

Run `node tests/galaxy-browser.mjs test-results/galaxy-candidate` with installed hardware Chrome. `GALAXY_URL` defaults to port 4183; the test checks actual WebGPU/WebGL desktop and portrait, paused/idle render counts, missing scenery, saved quality, Canvas and transparent output. It retains source fingerprints and screenshots. [Reference research](docs/evidence/galaxy-sky-2026-09-30/RESEARCH.md) and [implementation plan](docs/evidence/galaxy-sky-2026-09-30/PLAN.md) document the original cached sky art and shared-clock motion. The isolated candidate deploys through `npx wrangler deploy --config wrangler.sky-preview.jsonc`; production remains `wrangler.jsonc`.

## Living river and candlelit nauka

The combined `.4` candidate adds independently loaded licensed CC0 wooden hulls, original Blender candle/canopy details and a clustered village through the eighth authored asset, `river`. Download rights, shared 2K PBR maps and fresh export inspection are documented in [RIVER-V007](assets-source/blender/RIVER-V007.md); [river plan](docs/evidence/living-river-2026-09-30/PLAN.md) records the larger nauka and candle-light steering. Runtime uses the same simulation clock, bounded fragmented reflections, and one shadowless local candle light. Canvas has a procedural counterpart. Missing river geometry keeps its own fallback; it does not block the other seven assets.

Run the focused hardware suite with `GALAXY_URL` set to the candidate and a new evidence folder: it includes desktop/portrait WebGPU and WebGL, short landscape, seeded Willow/Saturn/Supernova, three boats, light-anchor bounds, pause/idle, missing-river recovery and transparent output. `ASSET_URL` selects the target for `node tests/assets-browser.mjs`, which aborts river/sky/terrace independently while holding shell assets during flight. Publish the reviewed combined candidate with `npx wrangler deploy --config wrangler.river-preview.jsonc`. Production continues to use `npm run cloudflare:deploy` from qualified canonical main.

`ASSET_URL` also selects the target for `node tests/asset-lifecycle-browser.mjs`. This strict CI gate holds embedded image decoding during navigation, rejects one corrupted PBR map, verifies complete procedural fallback and checks bitmap cleanup. Embedded GLB images decode directly from their already-downloaded buffer views through the pinned r180 parser hook; the regular glTF sampler/material/color-space path remains in use. The test forbids redundant blob fetches and retains strict console errors.


## Bottom collection and upper canopy

`node tests/stage-browser.mjs` checks all seven target sizes plus the 679/680px boundary, ten direct launches, drag cancellation, terrace placement, upper-apex profiles, rotation, panels and audio. `STAGE_HARDWARE=1` uses installed Chrome and checks WebGPU, forced WebGL and Canvas separately. `tests/launch-composition.test.mjs` is part of `npm test`. Capture same-seed before/after via `CAPTURE_URL` and `CAPTURE_PHASE` with `node tests/redesign-capture.mjs`. Publish isolated preview with `npx wrangler deploy --config wrangler.redesign-preview.jsonc`; production retains the documented clean-main `npm run cloudflare:deploy` path.

## Fixed moon and shared water waves

The next [moonlit water phase](docs/evidence/moonlit-water-2026-10-01/PLAN.md) adds shared boundary attenuation, four-point buoyancy, world-directed moon shading and explicitly scheduled planar reflection. `node tests/moonlit-water-browser.mjs <output>` uses installed native Chrome and checks all three backends, seven viewports, target caps, pause/hidden state, comfort settings, transparent disposal and missing normal texture. `WATER_URL` selects an origin. `node tests/moonlit-water-capture.mjs <output>` records matching seed/time/viewports; use `CAPTURE_PHASE=before` or `after`. `node tests/moonlit-water-performance.mjs <output>` performs sequential, counterbalanced production/candidate measurements with separate browser rAF, actual rendered cadence and CPU submission metrics. Run it with no other automated graphics workload. Physical phones, thermal endurance and completed GPU timings are separate qualifications. The isolated Worker deploys through `wrangler.moonlit-preview.jsonc` and has no production route; see [preview evidence](docs/evidence/moonlit-water-2026-10-01/PREVIEW.md).

The performance procedure reads existing live renderer/Simulation scalars through a test-only CDP Runtime closure binding, checked against a full QA snapshot before and after measurement. It preallocates 8192 numeric sample slots per interval; Debugger, forced collection and application API changes are not used. This avoids allocating full diagnostic graphs at 240 Hz. Legacy full-snapshot failures remain evidence, and the p95/hitch assertions are retained. `node tests/moonlit-water-profile.mjs <output>` adds timeline attribution only; traced timings do not replace the untraced gate. Portrait reflection rates are Ultra 15 Hz / Standard 10 Hz, with desktop 30/15 Hz and unchanged target-edge caps and surface detail.

`python scripts/generate-moon.py` (NumPy/Pillow) generates the local lunar disc from the credited maps in [moon provenance](assets-source/moon/PROVENANCE.md). GPU loads `moon` as the ninth independent enhancement; Canvas loads the same delivered PNG. `MoonComposition` uses CSS-pixel coordinates, and `WaterWaves` provides fixed directional wave coefficients and allocation-free analytic buoyancy/slopes. Future water changes must retain pause, Low and reduced-motion stillness and existing reflection budgets.

`node tests/moon-water-browser.mjs` uses installed hardware Chrome across WebGPU, WebGL and Canvas; `MOON_URL` selects a hosted origin. `tests/moon-water.test.mjs` is part of `npm test`. `CAPTURE_URL`/`CAPTURE_PHASE` select the matched-source capture through `tests/moon-water-capture.mjs`. Short PC performance comparisons use `tests/moon-water-performance.mjs`; they do not qualify physical mobile endurance. Publish an isolated candidate with `npx wrangler deploy --config wrangler.moon-preview.jsonc`. See [preview evidence](docs/evidence/moon-water-2026-10-01/PREVIEW.md).


## Signature candidate implementation

`feat/flagship-signatures` starts from the explicitly requested moon/water candidate `b064fe4`, retaining PR #25 and its preview. It adds IDs 10–12 without changing shortcuts 0–9. `FlagshipEffects.ts` generates discrete primary/secondary/closing recipes; existing carriers reserve all unborn children, and new children never schedule another generation. Fixed Pool gain/role/wave/curve arrays compact with positions. The main loop evolves colours and bounded transverse acceleration without new per-frame objects. GPU and Canvas consume the same stars, trails and stage times. Existing Low/Standard/Ultra preferences and caps remain.

`LaunchProfile.effectScale` is resolved with apex and selected terrace position, then frozen at admission. Sky drops get a scale for their selected screen point. The three-row 188px phone tray, intermediate 136px and wide 76px tray retain 48px targets; shoreline clearance on very short phones is resolved only at resize. Rotations preserve the committed flight and scheduled shows. See [the design/evidence contract](docs/evidence/flagships-2026-10-01/DESIGN.md).

Run `npm test`, `node tests/flagship-browser.mjs <output>` (software CI), `FLAGSHIP_HARDWARE=1` with installed Chrome for native backend evidence, and `node tests/flagship-offline-recovery.mjs <output>`. Native tests cover all seven target sizes. `tests/flagship-performance.mjs` runs a sequential fixed-state comparison against the retained moon preview. CPU/rAF timings are not physical-device or completed GPU timings. Cloudflare candidate deployment uses only `wrangler deploy --config wrangler.flagship-preview.jsonc`; there is no production route in that configuration.

`node tests/flagship-touch-browser.mjs <output>` exercises native touch dispatch and is included in mobile CI. `FLAGSHIP_URL` selects the hosted origin; `FLAGSHIP_HARDWARE=1` selects installed Chrome across all three backends. Performance reports include a counterbalanced repeat; see [both runs and limits](docs/evidence/flagships-2026-10-01/PREVIEW.md). [The gallery](docs/evidence/flagships-2026-10-01/comparison.html) stays outside public assets/precache.


## Open sky candidate regression

`node tests/open-sky-browser.mjs test-results/open-sky` exercises all thirteen responsive props, the left collection, four-direction mode knob, modal focus/pause ownership, fixed/random position, saved settings and immutable flight profiles. Set `OPEN_SKY_URL` to the served production build; `OPEN_SKY_HARDWARE=1` uses installed Chrome and verifies WebGPU, WebGL and Canvas independently. Without it, bundled Chromium exercises software WebGL and Canvas. `OPEN_SKY_QUICK=1` reduces the viewport matrix for CI while retaining the behaviors.

`node tests/open-sky-capture.mjs test-results/open-sky-captures` records native WebGPU ready and Willow views at phone/tablet/desktop sizes. Set `CAPTURE_URL` and `CAPTURE_PHASE=before` or `after`; the JSON records source fingerprint, seed and actual backend.

`node tests/open-sky-performance.mjs test-results/open-sky-performance` compares the retained flagship preview with `OPEN_SKY_URL` using counterbalanced runs. Close other test browsers first. Its CPU submission and rAF timings do not measure completed GPU work or physical-phone endurance.

The isolated configuration is `wrangler.open-sky-preview.jsonc`; it has no production routes. Run `npx wrangler deploy --config wrangler.open-sky-preview.jsonc` only after building and checking the candidate fingerprint. This candidate does not authorize replacing production.


`node tests/startup-browser.mjs test-results/startup` uses actual blocked entry/art requests to verify first-paint coverage, truthful asset progress, inert launch controls, moon handover, explicit early entry, failures, cache reuse and reduced motion. `STARTUP_URL` selects the built candidate. `node tests/open-sky-edge-browser.mjs test-results/edges` tests full usable terrace endpoints; `EDGE_HARDWARE=1` verifies native backends, and `EDGE_QUICK=1` is the bounded CI subset. The original effects' natural tails are visually inspected; signature principal-head envelopes have strict projected-bound assertions.

## Always Play

The [implementation receipt](docs/evidence/always-play-2026-10-02/IMPLEMENTATION.md) records the bounded four-pace director and current qualification. Unit checks are in `npm test`; `tests/always-play-soak.mjs`, `tests/always-play-browser.mjs` and `tests/always-play-performance.mjs` provide logical endurance, native interaction and sequential timing/video evidence. Use `ALWAYS_URL` for the isolated preview. CI uses explicitly labeled software WebGL/Canvas; physical-phone and flash-conformance claims require their own evidence.
