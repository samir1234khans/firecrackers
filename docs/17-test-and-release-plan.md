# 17 — Test strategy and release gates

Status: all application tests below are planned/unrun in this documentation baseline. A documentation link/schema check is not a graphics, audio, browser, or release test.

## Layers and tools

Use Vitest for pure simulation/configuration/state-machine tests and Playwright for browser interaction workflows, with versions selected at implementation. Official guides: [S17–S18](19-research-and-reuse.md). Add focused accessibility checks and manual assistive-technology review. Rendering performance and physical device behavior require real hardware evidence; a headless screenshot does not prove smooth GPU animation.

Use fixed seeds, versioned configurations, bounded clocks, and a dev scenario API unavailable to untrusted production input. Visual comparisons tolerate normal backend differences and focus on structure/timing/artifacts, not impossible cross-GPU pixel identity.

## Unit and integration cases

| Test | Scenario | Required result |
|---|---|---|
| T-01 | Catalog/schema: all five IDs, ranges, topology | Unique IDs, finite values, ordered ranges, no recursive finale, referenced families exist. |
| T-02 | Hold early release, pointercancel, key repeat | No commitment before threshold; exactly one fuse after successful activation. |
| T-03 | Fixed timestep at multiple render rates | Fuse/ascent/event times agree within simulation tolerance; no frame-dependent gravity/fade. |
| T-04 | Admission at every tier including finale | Future peak capacity reserved; rejection cannot enqueue a hidden launch; no negative pool count. |
| T-05 | Parent/child events | Crossette parents split once into four; finale children bounded; complete releases all reservations. |
| T-06 | Seed independence | Cosmetic/audio stream changes do not change future show cue order. |
| T-07 | Show history/cue bounds | Repeat and cooldown constraints hold; no queue/horizon overflow; manual takeover cancels only uncommitted cues. |
| T-08 | Audio event dedupe and suspend | Mute/pause/hide stops active/scheduled sources; no old reports replay on resume. |
| T-09 | Storage corruption/migration | Invalid preferences fall back; unknown fields ignored; live fuse/fullscreen/wake state never restored. |
| T-10 | Resource teardown | Repeated mount/unmount and recovery leave stable managed counts and one or zero active render loops as appropriate. |

## Browser and experience cases

| Test | Scenario | Required result |
|---|---|---|
| T-11 | First visit and replay help | User can select sound/flash options before launch, skip, learn at own pace, and replay. |
| T-12 | Manual end-to-end for five families | Select/place/light/watch/repeat works, each identity remains distinguishable. |
| T-13 | Pointer drag versus UI interaction | Dock and settings clicks never ignite; first reveal tap is consumed; second pointer cannot duplicate ignition. |
| T-14 | Keyboard and no-hold path | Whole experience is operable with named controls, visible focus, and no trap. |
| T-15 | Portrait/landscape/zoom/safe areas | Burst and controls fit; resize cancels unfinished hold but preserves selection; zoomed overlays scroll. |
| T-16 | Auto presets and takeover | All presets run within caps; manual selection pauses future cues; resume is explicit. |
| T-17 | Pause/reset/background/return | No catch-up explosions, ghost sound, or stuck capture; scene returns calmly. |
| T-18 | Capability refusal | Audio blocked, vibration absent, fullscreen denied, wake lock revoked, and storage blocked remain usable. |
| T-19 | Graphics backend and loss | Hero works on WebGPU and forced WebGL 2; loss/recovery does not blank the only available controls. |
| T-20 | Offline install/update | Complete offline package works after cold start; partial cache is labeled; update does not interrupt show. |
| T-21 | Two-tab build transition and rollback | Old/new clients retain consistent assets; rollback/update recovery is demonstrated. |
| T-22 | Missing asset/network interruption | Bounded retry; optional media degrades cleanly; wrong family is not substituted silently. |

## Visual, sound, performance, and safety cases

| Test | Scenario | Required result |
|---|---|---|
| T-23 | Six-stage hero recording | Coherent ignition/ascent/burst/droop, age-based trails, retained smoke relit by next burst. |
| T-24 | Family recognition | Reviewers distinguish all five at Standard without labels; Peony/Chrysanthemum differ structurally. |
| T-25 | Worst-case audio overlap | No clipping in inspected mix, no identical repeated report pattern, clean mute/fades. |
| T-26 | Flash/reduced-motion assessment | Documented assessment of worst-case rendered sequences; user reductions override director. |
| T-27 | Ten-minute reference-device run | Frame-time and managed-count targets measured with environment details, not a single average FPS. |
| T-28 | Mobile 30-minute / display two-hour soak | Counts plateau, smoke remains transparent, controls recover, no persistent growth or missed stop. |
| T-29 | Public build network/security review | No unexpected tracking, secrets, external runtime dependencies, or unrelated permissions. |
| T-30 | Asset provenance audit | All shipped media approved with required notices; no unlicensed reference extracts. |
| T-31 | New-user formative test | At least 4/5 observed users complete a launch unaided; pause/mute findability reviewed by all. |
| T-32 | Live deployment smoke test | Exact deployed commit verified; all five controls/assets work over production HTTPS. |

## Golden scenario set

Maintain seeds such as `willow-hero-001`, `crossette-split-001`, `finale-low-001`, and `festival-soak-001`, mapped through a documented seed-hash function. Store viewport, simulation timestamps, effect/configuration version, and renderer settings. Scenario names are fixtures, not existing recordings. Test low-tier reductions against their minimum silhouette rules.

Capture ignition, liftoff, expansion, late trail, smoke-relighting, settings, pause, and failure states. Raw video/reference rights must be reviewed before publishing recordings that contain third-party material. Actual app-generated test captures may be committed or attached to issues within size limits.

## Release blockers

Duplicate/unintentional ignition; uncontrolled queue or memory growth; lost pause/mute; hidden-tab audio catch-up; missing keyboard alternative; unresolved dangerous flashing pattern; broken primary render fallback on a claimed target; offline/update cache corruption; unapproved media; live deployment mismatch; or owner rejection of the realism bar. Do not waive these because the homepage loads.

Lower-priority issues can ship only with explicit support limitations and a backlog entry. A physical target that has not been tested must be named unrun; do not silently mark it passed based on viewport emulation.

## Evidence record template

For each run store: date, source commit, configuration version, dependency lock hash, OS/device/browser, backend, viewport/DPR/quality, network/power profile where relevant, scenario seed, commands or steps, result (pass/fail/unrun), metrics, capture/log paths, reviewer, and follow-up issue. Every release gate points to one or more of these records.

Suggested future location: `docs/evidence/<release-id>/`. Do not create fake successful evidence files to satisfy the directory structure.

## CI plan

M0: lint, typecheck, configuration validation, unit tests, build. M1: deterministic engine tests, interaction smoke tests, cleanup checks. M2+: show and family tests. M4+: offline/update/browser matrix and bundle budgets. Manual GPU/art/audio/accessibility/hardware gates remain separately recorded. CI permissions should be minimal; no production secrets are required for documentation or unit tests.
