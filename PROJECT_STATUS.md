# Project status

Updated: 22 September 2026. Build: `2026-09-22.1`.

## Current delivery

Viewability and launch recovery is implemented on `fix/viewability-recovery`, based on the newer video-flow branch. Runtime commit: `bbd1cd624e2700b01e8974e83a875bfeb476aa21`. The app is published at https://firecrackers-a93nle.v2.appdeploy.ai/ . Main and older branches were preserved.

The repair adds a readable initial loading/error page, React recovery boundary, finite graphics-startup deadlines, automatic WebGL/Canvas fallback, explicit compatibility/reload controls and guarded resize/cleanup. It retains the preferred 3D/Ultra experience and provides clearly labelled simpler Canvas graphics when GPU initialization is unavailable. Device feedback is visible inside settings, and small portrait/landscape controls remain reachable. Rocket/ground texture brightness is improved.

The newer one-press launch, immutable committed rocket, next-family selection, body-to-shell transition and persistent manual deck remain intact. This is not a rollback to the older radial UI. The previously hosted toolbar-safe layout is now normal tracked source rather than a pending CI patch.

## Delivery and evidence

AppDeploy snapshot: `1790036848382`; the host reported ready with empty reported frontend/network/backend errors. The public 31-module source fingerprint matched at 2026-09-22T00:29:21.800Z:

`46fe64fb3fe5481513e54e1dffe06be790c3953092c98aca9aa898a56aa387da`

Candidate runs `35671283665` and `35671283683` passed typecheck, lint, 70 unit/lifecycle/regression tests, build, audit, structural validation, the accelerated two-hour logical soak, 15 viewability/recovery cases and 28 launch/platform checks. This is not a hardware endurance result.

**Published verification is complete and passed.** Run `35672636416` verifies the actual public website, not only a local build: all 15 viewability/recovery cases and 28 launch/platform checks passed. The 31-module source fingerprint matched again at 2026-09-22T00:36:30.241Z. No unexpected console errors remained in the nominal launch suite. Intentional fault diagnostics and known host-only requests during deliberate offline testing are recorded separately, not silently discarded.

Final test-only checkpoint: `8bf5bc298c89df5c75505036bba0b5193856ced1`. It does not change the tested and deployed runtime modules. The initial live run's host-only offline logging failure is retained in the delivery record along with the passing rerun.

The full [delivery and qualification record](docs/evidence/viewability-recovery.md) records exact commits, public verification, actual captures and the handling of deliberately offline host-only requests. Older V3 and video-flow evidence remains historical, not a substitute for these results.

## Remaining qualification boundary

Physical Android/tablet, Safari/iOS, hardware WebGPU/WebGL parity, real-time GPU/thermal endurance, OBS and full flash/accessibility assessment remain unverified here. Final visual/audio approval is separate. No new backend, account system, assets provider, native wrapper, public license or domain migration was introduced.

Continue from the latest `fix/viewability-recovery`; do not reapply the removed host-toolbar patch or overwrite it with an older V3 snapshot. Promotion to main requires separate review.
