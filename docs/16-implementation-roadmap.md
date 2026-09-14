# 16 — Implementation roadmap and backlog

## Delivery method

Build in gated increments, not by creating all UI screens before proving the firework. The first playable Gold Willow must include enough environment, sound, and lifecycle behavior to judge the promise. Do not defer every realism feature to a final polish phase.

Each milestone ends with code, tests, a reviewable preview or local evidence, updated status, and a precise list of remaining work. Dates and effort estimates are intentionally not promised before the renderer spike. This roadmap does not schedule autonomous background work.

## M0 — Repository and reproducible foundation

Status: not implemented. Dependencies: documentation baseline.

Tasks: inspect current refs/worktree; create the authorized development branch; select compatible stable Node/package-manager/React/Vite/Three versions; commit lockfile and runtime version; scaffold TypeScript strict mode; add baseline lint/typecheck/test/build commands; implement accessible static scene shell; validate configuration; add CI that initially tests actual available code only.

Exit: a fresh checkout can install and build from documented commands; schema validation runs; controls remain accessible without a renderer; no secrets/deployment assumptions. Do not label a starter Vite screen as the fireworks prototype.

## M1 — Backend feasibility and Gold Willow vertical slice

Dependencies: M0. Highest technical/art risk.

Tasks: compare preferred WebGPURenderer on actual WebGPU and forced WebGL 2; build the fixed clock, pools, admission control, Gold Willow trajectory/trails, minimal smoke/light pass, input state machine, deliberate fuse, first audio layers, pause/resume and disposal. Use original/procedural placeholder props as needed. Supply deterministic scenario controls for developers only.

Exit: one complete placement-to-afterglow interaction; a second burst illuminates retained smoke; no duplicate ignition; no hard dependency on advanced compute; baseline frame-time/capacity evidence; keyboard alternative works; visual owner review reaches the agreed bar. If backend parity fails, document the alternative before implementing four more effects.

## M2 — Complete catalog and bounded show director

Dependencies: M1 accepted.

Tasks: implement Peony, Chrysanthemum, Crossette split/crackle, and Grand Finale composition as data-driven generators; validate ranges/schedules; add shuffle-bag variation, family/palette history, reservations, Calm/Festival/Finale presets, explicit manual takeover and resume.

Exit: five recognizable identities at Low/Standard; deterministic event topology; no recursive children or hidden launch queue; ten-minute preset simulations respect caps; reduced-flash rules apply to combined effects.

## M3 — Cinematic environment, final interaction, and audio pass

Dependencies: M1 foundation and M2 identity review.

Tasks: refine cloud/tree-line/haze, physically coherent-looking trajectories, lit smoke, temporal trail detail and exposure; apply tokens to responsive glass dock/settings/help; add motion reductions and first-run guide; acquire/produce approved audio, mix and variation; optional supported haptics.

Exit: complete art/audio review in portrait and landscape, no confetti aesthetic, no clipped mixes, operable hidden controls, all key exceptional states designed and implemented. Device-budget regressions are fixed before adding Ultra detail.

## M4 — Performance, lifecycle, and PWA hardening

Dependencies: playable M2/M3 baseline.

Tasks: enforce all pools, adaptive quality, managed-memory counters, context/device-loss recovery, visibility suspension, keep-awake/fullscreen truth states, versioned preferences, offline asset verification, prompt-style updates, reset, secure production headers.

Exit: stable reference-device runs, 30-minute physical mobile session, two-hour visible display soak, installed offline cold start, update/rollback tests, no unexpected audio on return, no cumulative resource leaks.

## M5 — Release candidate and production verification

Dependencies: M0–M4 gates.

Tasks: full functional/accessibility/flash-risk/compatibility review; rights audit; remove placeholders and dev-only overlays from normal use; finalize brand/icon/domain choices; deploy only to the agreed target; smoke-test the live exact commit; record support limits and rollback.

Exit: requirements traceability filled with actual evidence; no open release blockers; owner visual acceptance; known limitations documented; deployed commit and URL verified. A passing build alone is insufficient.

## Suggested issue-sized work packages

| ID | Work package | Milestone | Depends on | Evidence |
|---|---|---|---|---|
| B-01 | Toolchain, schema validation, static shell | M0 | None | Fresh-checkout build and configuration checks |
| B-02 | Renderer adapter and parity scene | M1 | B-01 | WebGPU/forced-WebGL captures and logs |
| B-03 | Clock, seeded events, pools, reservations | M1 | B-01 | Unit tests and bounded-count trace |
| B-04 | Placement/ignition/accessibility | M1 | B-03 | Pointer cancellation and keyboard E2E |
| B-05 | Hero Willow, trail history, smoke/light | M1 | B-02/03 | Complete hero recording and art review |
| B-06 | Audio scheduler and pause lifecycle | M1 | B-03/04 | Mute/background timing tests |
| B-07 | Other four catalog entries | M2 | B-05 | Family recognition and topology tests |
| B-08 | Director and manual priority | M2 | B-07 | Preset soak and takeover tests |
| B-09 | Glass UI, onboarding and responsive states | M3 | B-04/08 | State captures and accessibility review |
| B-10 | Final media provenance and mix | M3 | B-06/07 | Rights manifest and peak/listening review |
| B-11 | Quality manager and recovery | M4 | B-05/08 | Reference-device and loss-recovery evidence |
| B-12 | PWA/cache/update/reset | M4 | B-01/10 | Offline cold start and multi-version tests |
| B-13 | Security, accessibility and release matrix | M5 | B-09/11/12 | Recorded gate outcomes |
| B-14 | Production deploy and rollback | M5 | B-13 | Live URL, exact source commit, rollback check |

These are backlog definitions, not GitHub issues that have already been created.

## Deferred backlog

Native Android wrapper; OS live wallpaper; transparent broadcast source; wedding-host integration; remotely synchronized launches; video recording/export; music-reactive shows; saved public named shows; shareable seeds; custom color authoring; additional environments; optional true volumetric Ultra path. None may displace core realism, compatibility, or safety work without a decision update.

## Change control

Small artistic tuning changes update configuration version and review evidence. New user-visible modes, external services, licensing choices, telemetry, payments, and domain changes require owner direction. Every work session leaves a truthful handover with completed/in-progress/blocked items, current branch/commit, commands actually run, and next task.
