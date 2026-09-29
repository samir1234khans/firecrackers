# Grand Collection — completion checkpoint

Date: 29 September 2026. Owner request: finish remaining work and keep checkpoints on GitHub.

## Reconciled baseline

Continue `feat/grand-collection` at `9f081db8cf3ca626febb9161ba74c907f9852e65`, not an older five-effect branch. The Grand Collection is already present in the applied AppDeploy source snapshot `1790640515766`, including the compact-layout CSS correction. Do not resend unchanged runtime files or infer live state from the stale root status document.

The latest candidate validation run `36501591721` passed its engine, desktop, mobile and recovery jobs. The older public verification run `36501216935` passed source parity and desktop checks but failed on cramped 320x480 layout; mobile original-flow tests were skipped after that failure. A previous status statement that no CI existed was inaccurate: the commit helper filtered to pull-request-triggered runs, while these were push-triggered runs. Check all event types using the actual run IDs.

## Completion plan

1. Preserve and retrieve the exact current source and lockfile-backed dependencies. Do not overwrite unrelated work or change main.
2. Run public source verification and all ten-firework, original launch/offline/platform and recovery/layout checks on the current deployed source. Keep failures visible; never weaken the free-sky or reachable-control assertions.
3. Inspect fresh desktop, mobile and very-short-screen captures. Repair reproducible application issues, checkpoint fixes, rerun candidate checks and deploy only changed files if necessary.
4. Review the new recipe/reservation, palette, child-carrier, selector, keyboard and persistence tests. Record which are executed versus merely specified.
5. Reconcile README, PROJECT_STATUS, agent/development guidance and the documentation index with ten effects, the one-press launch, the active branch, source fingerprint and actual verification results.
6. Preserve a final delivery record with exact source/deployment revision, test totals, failed-then-fixed findings, evidence links and remaining physical-device/art qualification boundaries.

## Target flows and coverage map

- Entry -> Grand collection -> select each new family -> Launch firework -> distinct visible burst -> cleanup and ready: `tests/grand-collection-browser.mjs`.
- Ten selections, next-family memory, shortcuts 1–9/0, immutable active flight, composite pause and child completion: grand browser and recipe/engine regression tests.
- Original families, duplicate-launch prevention, manual takeover, offline cold reload, sound and platform settings: `tests/video-flow-browser.mjs`.
- Seven viewport sizes, missing app files, graphics startup and interrupted rendering, usable compatibility fallback: `tests/viewability-browser.mjs`.
- Published source identity: `scripts/generate-release.mjs` and `scripts/verify-preview.mjs`; static host diagnostic labels are the only excluded metadata.
- Hosted manual QA coverage remains in `tests/tests.json`; its seven existing workflows include both collections and recovery. It must not be replaced by a narrower happy-path suite.

## Deployment preflight

Existing app ID `firecrackers-a93nle`, frontend-only React/Vite. No new accounts, backend, paid services, resource uploads, domain changes or dependencies are required. Preserve recovery, offline assets, default Ultra, sound-off startup and reduced flashes. Read the current hosted source before any update, use verified unique diff anchors, send only changed files, poll deployment through a terminal status, and recheck public parity and browser behavior. No deployment is needed merely to repeat an already-applied patch.

## Verification environment

The Browser plugin/skill is not listed in this session. Use the repository's Playwright workflows. Direct Git/network access from the local container currently fails DNS resolution; use the authorized GitHub connector/artifact routes. Do not alter or bypass managed browser/network policy. CI browser emulation and accelerated logical time do not prove physical hardware performance, Safari/iOS, OBS or thermal endurance.

## Status of this checkpoint

Baseline reads and the candidate-CI inspection are complete. A fresh public run, artifact review and the final status/evidence update are being initiated by this checkpoint, not predeclared as passed. Follow the final delivery record for outcomes.
