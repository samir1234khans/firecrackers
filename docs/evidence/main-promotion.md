# Grand Collection promotion to main

Date: 29 September 2026. Owner authorization: promote all latest work to main and make it the current code baseline.

## Source reconciliation

The approved delivery source is `feat/grand-collection` at `7b448ee730ba1170149e0a5d7d1e3895862a6ad1`, build `2026-09-29.1`. Before promotion, main was `7603a2c63ef1f4e36e4c1d845915632640d83369`. The delivery source is 73 commits ahead and zero commits behind main; main has no conflicting independent work.

All current heads of the following approved development lines are already ancestors of the delivery source:

| Branch | Verified head |
|---|---|
| feat/fireworks-v1 | `589fe284a097a3dd9b9c691e95a9c15189b0bbc3` |
| fix/ignition-reliability | `6b1a5fa4c5613e30b5a81ff314a5377d0861c62b` |
| fix/video-launch-flow | `501b346e9624e9c665a19ddcff561e0657c382c0` |
| fix/viewability-recovery | `f48a8bf4a153ce5077a8901738bb4883aebc456b` |
| feat/grand-collection | `7b448ee730ba1170149e0a5d7d1e3895862a6ad1` |

`feat/fireworks-v1-implementation` at `16d9d1d8056ff6cb1d47b7fff92c3731395efdce` is the separate historical implementation, not a successor to the delivered runtime. It diverges at the old main baseline and introduces a competing App.tsx and JavaScript engine. Its seven alternate commits are preserved on that branch rather than mixed into the tested ten-effect application. No branch is deleted, reset or force-pushed.

## Promotion contents

The release includes all ten fireworks, both collections, the cinematic interface, perspective stage and rendering, the single-press launch and its reliability fixes, recovery/Canvas fallback, responsive layouts, offline support, tests, locked dependencies, specifications and delivery evidence.

This preparation changes only contributor/status documentation and GitHub workflows. It does not retune the verified application or change its build number. The main CI entry now calls the full Grand Collection validation workflow, retaining unit/type/lint/build/audit/soak checks and both desktop/mobile original-flow, Grand Collection and recovery suites. It serves the exact production build before browser tests. Main pushes and pull requests into main use the same workflow. Source-history and live-receipt checks run after the initial promotion without altering the public app.

## Validation boundary

The original delivery has passing candidate run `36501591721`, public verification run `36507918339` and final documentation run `36509365146`. See the [delivery record](grand-collection-delivery.md) and [results](grand-collection-results.json) for their precise scope.

The promotion pull request must complete its new checks before merging. Use a normal merge commit with the expected head SHA, preserving both histories. After merge, confirm main contains the incoming head, inspect its CI and the Main promotion verification result, and record the merge SHA and final results in the pull-request conversation. This file is a preparation/audit record, not a predeclared successful merge or test result.

The published app already contains this runtime, so branch promotion does not require a duplicate deployment. Existing physical-device, Safari/iOS, hardware WebGPU, thermal/endurance, OBS and full flash/accessibility qualification boundaries remain open; promoting the source does not certify those conditions.

## Ongoing development

After this authorized promotion, main is the canonical integration baseline. Start new feature/fix branches from current main and use a pull request back to main. Historical delivery records retain their original branch names and dates. Read current README, PROJECT_STATUS, AGENTS and DEVELOPMENT before reusing old plans.
