# Viewability and launch recovery — 22 September 2026

Build: `2026-09-22.1`. Preview: https://firecrackers-a93nle.v2.appdeploy.ai/ .

## Source and delivery

The repair starts from `501b346e9624e9c665a19ddcff561e0657c382c0` on `fix/video-launch-flow`, not the older V3 branch. The previously applied host-toolbar correction is incorporated into normal tracked source. The new implementation is `bbd1cd624e2700b01e8974e83a875bfeb476aa21` on `fix/viewability-recovery`; `2ec43668c3e9241362f5c25529676f399d8c5e18` adds read-only public verification without changing runtime modules.

The existing preview was updated in place to AppDeploy snapshot `1790036848382`. Main, other implementation branches, the alternate Nightfall app and domain configuration were not changed. The host reported ready and empty frontend/network/backend error collections. Independent source and browser checks are recorded below rather than treating ready status as sufficient.

## Repairs delivered

A nonempty HTML loading screen now precedes React. The bootstrap catches missing or stale entry chunks and leaves readable reload/compatibility actions. A React error boundary prevents an interface exception from leaving a blank root.

GPU initialization and renderer-module loading have finite deadlines. Startup tries the original 3D renderer, forced WebGL when needed, and finally a GPU-independent Canvas 2D renderer. Pending initialization is invalidated on cleanup so a late driver cannot replace the new canvas. Explicit `?backend=canvas` opens the fallback directly. Compatibility graphics is visibly labelled, uses simpler rendering, and preserves the same five-family simulation rather than playing a substitute video. The primary 3D renderer and Ultra preference remain unchanged as the preferred experience.

A lost graphics context exposes reload, lower-quality retry, compatibility and settings actions. Resizing is guarded, unsupported ResizeObserver does not crash startup, and idle gaps no longer contaminate automatic-quality frame samples. Device-feature feedback is visible inside settings instead of being concealed behind the modal.

Small portrait and landscape layouts retain the launch action and settings access. The host toolbar remains visible and outside the app's launch/reset hit targets. Rocket paper and ground texture brightness were raised to make the physical staging easier to see without brightening the entire night sky.

The newer single-press launch flow remains intact: one committed rocket, no premature duplicate on the platform, immutable active family, a distinct next selection, continuous body-to-shell transition, burst and ready-again state. Manual pause, show takeover, silent startup, comfort preferences, offline caching and protected display output are retained.

## Completed candidate validation

Runtime validation run `35671283665`, job `106568077572`, completed successfully. Typecheck, lint, the 70-test unit/lifecycle/launch/fingerprint/recovery suite, production build, dependency audit at the high-severity threshold, documentation structure and the accelerated 7,200-second logical soak all passed. The soak is not a real-time GPU, thermal or physical-device test.

Viewability validation run `35671283683`, job `106568075685`, completed successfully. The actual JSON artifacts report 15 viewability/recovery cases passed and 28 launch/platform checks passed, with no reported failures. Artifact `10671875471` contains the reports and rendered screenshots.

The seven layout sizes are 1280×800, 1024×768, 393×851, 320×568, 320×480, 844×390 and 640×360. Tests check overflow, launch button dimensions and actual hit testing, available sky space, settings and return to play.

Negative paths include blocked GPU contexts, a missing graphics module, an actual WEBGL_lose_context interruption, a blocked main chunk, and an injected React exception. Recovery tests exercise the visible resulting UI; graphics fallback and context-loss recovery include an actual input-to-burst sequence. Five-family visual checkpoints use labelled deterministic advancement; they are not FPS measurements.

The 28-check launch suite uses real desktop clicks and mobile-emulated taps for launch, busy rejection, a second selected launch, pause/resume and manual takeover. It also checks full family rendering, preferences, reset cancellation, a genuine production-service-worker offline cold reload, short landscape and protected transparent display return.

## Public qualification

The first published run `35672137296` passed public source parity and all 15 viewability/recovery cases. Its launch job completed all 27 user-facing checks but failed the final console assertion because an additional host endpoint, `https://api-v2.appdeploy.ai/p`, attempted a request during the deliberately offline reload. The exact failure and request timing are retained in artifact `10672101163`; it is not represented as a fully passing run.

The app source snapshot contains no references to the host's API domain. The test-only follow-up `8bf5bc298c89df5c75505036bba0b5193856ced1` classifies only that observed endpoint alongside the already known host overlay/warmup URLs, and only for ERR_INTERNET_DISCONNECTED during the intentionally offline segment. All failed requests are retained in the report; ordinary application and online errors still fail. No runtime code, source fingerprint or deployed snapshot changed for this test correction.

Published run `35672636416` completed successfully on the same deployed build. Source/recovery job `106572299447` passed source parity and all 15 viewability/recovery cases. Launch job `106572299202` passed all 28 launch/platform checks, with no failed check and no unexpected console error. The two known host requests that failed only during deliberate offline testing are retained in the expected-offline diagnostic list.

The final reports and actual hosted screenshots were downloaded and inspected. The final source receipt was fetched at 2026-09-22T00:36:30.241Z from the public URL and matched again. The machine-readable [public qualification summary](viewability-public.json) preserves this result. Viewability artifact: `10671777044`. Launch artifact: `10670984091`. Both belong to the successful published run, and Actions artifact retention is seven days.

The exact primary interaction exercised was open → skip introduction → select Gold Willow → click/tap Launch → reject a duplicate → select Peony as next → finish the committed Willow → burst → launch Peony. This passed on desktop and mobile emulation. The seven additional screen sizes and deliberate failure paths also passed against the hosted site, with the provider toolbar left intact.

The independently fetched receipt at 2026-09-22T00:29:21.800Z matched all 31 upgraded modules, with zero mismatches. Expected and actual SHA-256 were:

```text
46fe64fb3fe5481513e54e1dffe06be790c3953092c98aca9aa898a56aa387da
```

The normalization excludes only audited static host diagnostic labels and canonical JSX formatting. Raw differences from 54 host labels are recorded rather than hidden. This is a 31-module application-source parity result, not a claim that the hosting wrapper, index HTML or entire repository is byte-identical.

## Environment and remaining boundary

Rendered validation used Chromium in GitHub Actions with software WebGL/SwiftShader and mobile emulation. Browser plugin was not available. Local browser navigation was blocked by the execution environment; that was not bypassed, and no local live-browser pass is claimed. Local compilation/tests and the independent CI browser runs are identified separately.

The application tests fail unexpected console errors. A separate diagnostic list permits only three exact hosting-provider URLs failing with ERR_INTERNET_DISCONNECTED during the deliberately offline segment. Injected failure tests record their intentional diagnostics separately. This does not suppress unrelated application errors.

This repair does not certify every real device or browser. Physical Android/tablet, Safari/iOS, actual hardware WebGPU parity, long-duration graphics/thermal behavior, OBS composition and a full flash/accessibility assessment remain qualification work. The Canvas renderer is a clearly identified compatibility fallback, not an assertion of equivalent 3D/PBR fidelity. Final visual/audio approval remains the owner's decision.

## Reproduction

Use the pinned Node version and lockfile. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:soak`. After starting the production preview on port 4173, use `node tests/viewability-browser.mjs /tmp/viewability` and `VIDEO_FLOW_URL=http://127.0.0.1:4173/ node tests/video-flow-browser.mjs /tmp/launch`. The public verification workflow checks the deployed source receipt and repeats both browser suites against the actual hosted URL.

Continue from the latest `fix/viewability-recovery`. Do not reapply the removed host-toolbar patch or overwrite this repair with an older V3 transcript. Production promotion to main remains a separate reviewed action.
