# Firecrackers — video-led launch-flow repair plan

## Scope and baseline

The evidence is the supplied 12.95-second, 720 × 1560 portrait screen recording (`123206.mp4`). It has no audio track, so it cannot establish audio defects. The inspected live source is AppDeploy **v9**, snapshot **1789966109137**, build **2026-09-21.1**. GitHub's `fix/ignition-reliability` ends at **6b1a5fa4c5613e30b5a81ff314a5377d0861c62b** and does not yet contain the v9 changes. The repair branch is **fix/video-launch-flow**. Preserve the original Nightfall app, both older implementation branches and main; do not merge or overwrite them during this repair.

This is a repair of the existing 3D implementation, not a replacement with an unrelated fireworks demo. Nightfall remains the reference for clear controls, readable effect silhouettes and a satisfying launch payoff. Its effect code is not being blindly substituted for the advanced engine.

## Findings and acceptance register

Evidence labels: **Video** means directly visible in the supplied recording. **Code** means independently found in the inspected implementation. **Risk** means a related case to test, not a defect already proven by the recording.

| ID | Priority / evidence | Problem and repair | Acceptance |
|---|---|---|---|
| F01 | P0 / Video 1–2.5s, 6.5–8s; Code | A fresh rocket appears on the platform while the committed rocket is airborne. `prepared` is reset at lift-off and the renderer draws a second prop. Use a single committed-launch lifecycle; rearm after the primary break, not at lift-off. | One manual tap creates one rocket. The platform is empty during flight. No replacement appears until rearm. |
| F02 | P0 / Video 1–2.5s; Code | The launch action becomes available while the same launch is still in ascent. Derive button enablement and admission from the same simulation guard. | Rapid touch/mouse/keyboard activation cannot admit a second manual launch during fuse or ascent. |
| F03 | P0 / Video 2–3s, 7.5–8.5s; Code | A large solid rocket hangs high in the sky, then disappears into a burst. Use a continuous physical flight with a decelerating coast and a staged body-to-glow transition instead of an oversized stationary prop. | Position and velocity remain continuous; powered motion accelerates, coast decelerates, and the primary break occurs near the apex without a frozen hold. |
| F04 | P0 / Code, consistent with Video | The previous tuning reaches a target height at a timer while retaining substantial upward velocity. Solve powered duration and coast from a common virtual gravity and target apex. | Automated trajectory samples show the expected acceleration signs, bounded apex error and near-zero vertical speed at the break. |
| F05 | P0 / Video; Code | Motor glow, flight trail and burst use different offsets from the model origin. Introduce shared model-axis attachment points for body centre and motor outlet. | Exhaust starts at the motor; the leading glow and primary burst share the same moving shell centre. No jump at transition. |
| F06 | P1 / Code | Stage/placement can represent the next selection rather than the committed rocket. Keep active family/position immutable; selecting another family sets the next choice only. | Selecting another family during fuse or flight never changes the airborne rocket, moves it, or admits another launch. |
| F07 | P1 / Video 4.5–6s | Selecting the next family is not clearly distinguished from the effect currently playing. Show full next-selection identity and separate live stage feedback. | Full selected name is readable; feedback explains that the current launch finishes first. |
| F08 | P1 / Video | The circular primary trigger still looks like a hold/progress widget despite being a click action; its text is tiny and wraps awkwardly. Replace it with a stable, clearly labelled rectangular launch button. | One obvious primary action, normal pointer/keyboard semantics, visible disabled/busy copy and a comfortably sized touch target. |
| F09 | P1 / Video | “Ready”, rising status and disabled appearance can contradict one another. Derive all labels from one lifecycle snapshot. | Status and primary button agree in loading, ready, fuse, thrust, coast, break, afterglow, paused and error states. |
| F10 | P1 / Video | Duplicate Auto show entry points and numerous small placement controls clutter the launch deck. Keep one show-mode rail; simplify placement into a labelled slider and centre action. | Manual launch and show selection are distinct, discoverable and not duplicated. Placement remains usable by touch and keyboard. |
| F11 | P1 / Video | Family labels, particularly Chrysanthemum, truncate or become too small. Use compact card labels plus an untruncated selected-name caption. | All five families have unique accessible names. Full selected identity is visible at 360–430px widths. |
| F12 | P1 / Video; Code | The same heavy deck occupies valuable sky space on mobile. Fit compact controls to actual viewport height and safe areas, without moving targets during a launch. | No horizontal scrolling, overlapping buttons, hidden primary action or deck movement through a sequence at portrait and short landscape sizes. |
| F13 | P1 / Code | Camera framing uses hard-coded deck allowances rather than actual layout. Measure the rendered deck/header and frame the flight/canopy around those boundaries. | Platform is above the controls; launch and principal burst are visible. Resize changes the view, not airborne physics. |
| F14 | P1 / Video | The highly lit pedestal and dotted runway compete with the rocket. Reduce their brightness and keep the atmosphere subordinate to the effect. | The rocket/fuse/burst remain the dominant luminous events; the original 3D setting is retained. |
| F15 | P1 / Code | Afterglow records continue consuming active launch units for a fixed 16 seconds even when no rocket remains. Separate effect residue from active launch occupancy while preserving particle reservations. | Subsequent launches are available after rearm when real capacity permits; retained particles/smoke remain bounded. |
| F16 | P1 / Code | An action can look available yet be rejected by capacity limits. Include admission capacity in the snapshot and explain waiting states. | No silent failed launch. Capacity rejection has truthful feedback and recovers as particles expire. |
| F17 | P1 / Code / Risk | Old hold listeners, stale control-hide logic and newer click semantics have accumulated. Remove obsolete UI paths without weakening engine-level guards. | No delayed launch from blur, release, focus, cancellation or a hidden control. Manual controls remain stable. |
| F18 | P1 / Risk | Pause, settings and returning from a hidden tab can disagree about time. Preserve separate pause intentions and clock reset. | Pausing freezes the same rocket; closing a panel preserves manual pause; returning from a tab does not fast-forward bursts or play queued sound. |
| F19 | P1 / Risk | Auto/manual takeover can cancel a committed effect or restart queued launches. Preserve the active effect and stop future automatic scheduling. | Family selection/Manual stops future auto launches; already committed fuse, flight and finale carriers finish. |
| F20 | P1 / Risk | Scene/transparent display modes can retain interactive framing or leak controls into output. Preserve presentation behavior explicitly. | Presentation links remain silent, controllable and return to manual; transparent output retains its alpha behavior. |
| F21 | P1 / Code | Build identity is buried in settings and stale cached versions are difficult to distinguish. Expose a small build identifier and an obvious update action when an update is waiting. | The delivered build is identifiable in the UI and release receipt; no automatic reload in the middle of a launch. |
| F22 | P1 / Risk | A build success or empty host error list is not rendered-flow evidence. Run real browser workflows and capture fuse/flight/break/next-launch frames. | Desktop and touch-emulated runs exercise actual clicks and bursts, collect console errors and verify the rendered prop count/positions. |
| F23 | P1 / Code | AppDeploy v9 and GitHub no longer match. Reconcile the deployed source and keep one repair branch with source/evidence. | GitHub and the deployed repair share the modified modules and a verifiable build fingerprint. |
| F24 | P2 / Risk | Low/Ultra settings, reduced motion/flashes, audio, fullscreen, wake lock, offline, reset and recovery may regress during UI work. Include them in regression coverage and report actual test scope. | Existing options remain available, opt-in capabilities are not misreported, reset requires confirmation, and failures keep recovery controls accessible. |

## Implementation order and file map

1. **Reproduce and preserve.** Extract timestamped frames. Reconstruct the inspected v9 source on an isolated local checkout; retain the v9 AppDeploy snapshot as rollback. Provision the repository's pinned dependencies, not newer Three.js APIs.
2. **Repair the simulation contract.** Work in `src/engine/Simulation.ts`, `src/engine/catalog.ts` and a shared rocket-geometry/motion helper. Define committed launch, busy/capacity states, apex-coast integration, shell/motor attachments, rearm and residue cleanup. Keep fixed-step seeded simulation outside React.
3. **Repair the rendered lifecycle.** Update `src/engine/Renderer.ts`, `src/graphics/RocketProp.ts`, `src/graphics/ParticleScene.ts` and `src/graphics/LaunchStage.ts`. One object must be followed from platform through flight. Add inspectable diagnostics for rendered stage/airborne props; share trajectory attachment calculations rather than duplicating offsets.
4. **Make mobile interaction legible.** Update `src/ui/CinematicHUD.tsx`, `src/App.tsx` and one scoped flow stylesheet. Replace the hold-looking primary control, remove duplicate show action and the separate inspector, retain full selected-name/status copy, simplify placement, preserve stable controls and modal accessibility.
5. **Frame and recover correctly.** Observe actual layout bounds in `src/engine/useWorld.ts`/renderer; keep resize out of simulation physics. Preserve hidden-tab/manual pause, show takeover, graphics recovery, output modes and explicit PWA update behavior.
6. **Validate before publishing.** Run typecheck/lint, existing engine tests and new trajectory/lifecycle tests. Run actual desktop/touch interactions, rapid taps, selection mid-flight, repeated launches, pause/resume, automatic takeover, settings and short landscape. Capture actual rendered screenshots; never substitute generated concepts.
7. **Publish and verify.** Deploy only changed source/test files to `firecrackers-a93nle`, wait for terminal host status, inspect errors and run a live build/flow verification. Keep Nightfall untouched. Save a GitHub checkpoint, the final test results and specific untested hardware/browser cases.

## Intended state contract

- **Ready:** exactly one prepared prop in interactive manual mode; launch and placement available when particle capacity permits.
- **Fuse:** one committed stationary prop; launch and placement locked, next-family selection allowed; fuse attached to that prop.
- **Powered ascent:** same committed prop leaves the platform; platform is empty; exhaust follows the motor; launch stays locked.
- **Coast:** upward velocity decreases smoothly; body becomes less visually dominant and the moving glow takes over; no hovering or reset.
- **Break:** primary burst originates at the shell centre; the body is removed in the same render lifecycle; a brief rearm interval is explicit.
- **Afterglow / ready for another:** embers and smoke finish independently; one new prepared prop appears only after rearm; admission still observes capacity limits.
- **Paused / panel / hidden / error:** simulation time does not advance. Controls explain the condition and provide a truthful resume/recovery path.

## Preflight checklist

- Existing frontend-only React/Vite app; no backend, new API, SDK, paid service or dependency upgrade is needed.
- Uploaded video is evidence only, not an app asset. Do not upload the user's recording or phone/browser chrome to the public repository.
- Inspect current source before edits; every deployment entry contains a unique path and only changed content/diffs.
- Keep `tests/tests.json` as JSON; 3–5 coverage-complete user workflows, exactly one sanity test, meaningful negative/guardrail coverage.
- Use readable multiline code; keep simulation memory/resource bounds, cleanup, audio opt-in and reduced-flash settings.
- Require real type/build/runtime results; distinguish tests written from tests executed.
- Include app ID, type, model, intent, initiator and change type when publishing. Poll until ready/failed and inspect errors even when ready.
- No force push, branch deletion, main promotion, Nightfall overwrite, secret handling or domain change.

## Release qualification boundary

The supplied recording proves defects on the recorded phone, not their precise CPU/GPU cause. Browser emulation can prove the repaired logical/DOM/rendered sequence but cannot certify physical Android thermals, Samsung Browser, Safari/iOS or hardware WebGPU. Those remain explicit qualification items unless actually exercised. “All existing issues” is treated as all issues found in this video/source audit plus the tested regressions—not a claim that every possible device/browser is defect-free.
