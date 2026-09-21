# 02 — V1 requirements and acceptance

Status: specification, not a test result. All numbered requirements are mandatory for the planned V1 unless explicitly marked conditional. Detailed defaults are in the decision register. Requirement IDs must be referenced by implementation tasks and release evidence.

## Experience

| ID | Requirement | Acceptance condition |
|---|---|---|
| FR-01 | Single-screen responsive scene | The sky remains the primary surface in portrait, landscape, and desktop. Settings/help use overlays; there is no dashboard or marketing-page detour. |
| FR-02 | Five distinct fireworks | All five catalog entries are selectable, named accessibly, and visibly distinguishable at Standard quality. Peony and Chrysanthemum cannot be the same burst with different colors. |
| FR-03 | Placement | Selecting an item creates one unlit preview. Pointer drag or left/center/right controls move it within the ground strip; sky taps never accidentally ignite it. |
| FR-04 | Intentional ignition | A valid uninterrupted hold lights the fuse once. Early release cancels ignition, not the whole selection. A non-hold accessible control starts the same sequence. |
| FR-05 | Full physical-feeling lifecycle | Fuse, ascent, burst, secondary events where applicable, afterglow, and cleanup occur without teleportation, duplicate bursts, or prematurely erased smoke. |
| FR-06 | Bounded overlap | A new unlit item may be prepared after launch. Admission control preserves already accepted effects and never silently queues a later unexpected ignition. |
| FR-07 | Realism | Trails follow trajectories and fade by age; particles fall and decelerate; smoke drifts consistently and is illuminated locally. No mandatory camera shake or full-screen white flash. |
| FR-08 | Sound controls | The app is usable silently. Sound begins only through an enabled, successfully activated audio context. Mute immediately suppresses active and scheduled sounds. |
| FR-09 | Haptics | Supported devices may provide short opt-in pulses. Unsupported/disabled vibration does not break ignition or misrepresent the toggle as active. |
| FR-10 | Directed auto-show | Calm, Festival, and bounded Finale follow pacing, overlap, repetition, and resource rules. They are not an unbounded interval spawning effects. |
| FR-11 | Manual priority | Beginning manual selection pauses new automatic scheduling. Existing bursts finish. Auto never resumes unexpectedly after manual takeover. |
| FR-12 | Pause and controls recovery | A visible or readily recoverable pause stops new launches and freezes the simulation; audio/haptics stop. Tap, pointer movement, or keyboard focus restores hidden controls without triggering ignition. |
| FR-13 | First-run help | A short visual introduction leads into actual steps. It is skippable, untimed for reading, and replayable. Completion is saved after success or explicit skip, not merely elapsed time. |
| FR-14 | Settings persistence | Only versioned non-sensitive preferences persist. Corrupt, blocked, or unavailable storage falls back safely without preventing play. |
| FR-15 | Install and offline | Supported browsers can install the PWA; the normal URL works regardless. After the selected offline package is verified cached, a cold offline load can run all five effects and their packaged sounds. |
| FR-16 | Decorative display | The same scene can hide controls and loop a paced show. A user-enabled keep-awake attempt has accurate status; exit/pause remains discoverable. |
| FR-17 | Fullscreen | Fullscreen requests originate in user interaction and handle refusal. Viewport-filling mode works when the API is absent. |
| FR-18 | Lifecycle and recovery | Hidden-page suspension cancels delayed audio and launch timers. Return offers resume without catch-up explosions. Render failures expose retry/lower-quality/static recovery. |
| FR-19 | Asset readiness | Ignition is not accepted until critical assets and capacity are ready. Missing optional sound/ambience has a silent fallback; unavailable visuals are not disguised as finished assets. |
| FR-20 | Reset | Reset clears preferences/onboarding when requested, releases resources, and returns to a calm idle scene without a reload loop. |

## Non-functional obligations

| ID | Requirement | Acceptance condition |
|---|---|---|
| NFR-01 | Sustained rendering | Meet the reference-device frame-time targets in document 12; include a 30-minute device session and a two-hour display soak. Targets are validated, not advertised speculatively. |
| NFR-02 | Resource bounds | Particle pools, trail samples, smoke, light envelopes, audio voices, and show queues have enforced finite limits. Recorded counts plateau during a soak. |
| NFR-03 | Renderer compatibility | The chosen Three.js path passes the same hero-effect scenario on WebGPU and forced WebGL 2. A feature requiring unsupported compute cannot enter the baseline. |
| NFR-04 | Input accessibility | Every drag/hold workflow has a keyboard and single-pointer alternative; controls have names, focus states, and sufficient target size. No keyboard trap. |
| NFR-05 | Flash and motion handling | Reduced motion, reduced flashes, pause, and mute are available before the first burst. Final sequences undergo flash-risk assessment; visual restraint alone is not proof of compliance. |
| NFR-06 | Network/privacy | No accounts, secret keys, third-party tracking, permissions unrelated to this experience, or remote runtime asset dependencies. Hosting access logs are disclosed separately. |
| NFR-07 | Reproducibility | Seeded event scheduling and versioned configurations reproduce scenario structure for testing. Pixel-identical output across graphics backends is not required. |
| NFR-08 | Update integrity | A service-worker update does not interrupt an active show. Cache versioning avoids an app/assets mismatch and supports a tested recovery path. |
| NFR-09 | Asset provenance | Every shipped texture, model, font, sound, and adapted code fragment has source/ownership and reuse records. Reference videos are not automatically reusable assets. |
| NFR-10 | Release evidence | Release notes identify source commit, dependency lock, browser/device versions, passed/failed/unrun tests, and deployment URL. No fabricated green checks. |

## Cross-cutting acceptance rules

All state-changing input must be idempotent under double clicks, pointer cancellation, key repeat, resize, and tab switching. Settings remain operable while the scene is paused. Flash reduction and user pause override automatic-show choreography. Background means decorative content in a visible app, not guaranteed execution under the operating-system lock screen.

Derived defaults such as numeric particle budgets may change after profiling without reopening the product scope. Removing a family, a manual gesture stage, an accessibility path, or a browser fallback is a product decision and requires an explicit decision-register change.


## Video-flow repair amendment — 21 September 2026

For build `2026-09-21.2`, the manual primary action is a single press, not a hold gesture. A committed rocket owns the platform through fuse and ascent; a short rearm follows the primary break. Next-family selection is allowed without mutating the current flight. Controls remain visible in interactive mode. Resource admission includes future particle reservations but no fictitious launch occupancy from afterglow-only records. See [the video-flow plan](video-flow/PLAN.md) and [validation contract](video-flow/VALIDATION.md) for acceptance and test scope.
