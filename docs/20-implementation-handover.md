# 20 — Implementation handover

## Current handover boundary

This repository contains an implementation-oriented planning baseline, not a runnable app. The owner's latest task authorized documentation and storage on GitHub. Use the following prompt when the owner starts the implementation phase. Read current refs/status first because later work may already have changed this state.

## Ready-to-use implementation prompt

```text
Work in https://github.com/samir1234khans/firecrackers only.

Inspect the current repository, branch refs, worktree, AGENTS.md, DEVELOPMENT.md,
PROJECT_STATUS.md, and docs/README.md before making changes. Preserve existing
work; do not reset, force-push, reorganize unrelated folders, or assume the repo
is still documentation-only.

Implement the Firecrackers web app from this repository's accepted requirements.
The goal is one realistic festival-night screen with a restrained layered-glass
UI. Users choose one of five fireworks, place the virtual prop, deliberately
light its fuse, and watch a physically coherent-looking ascent, burst, smoke,
and afterglow. The five identities and their structural differences are in
specs/fireworks.v1.json and docs/04-firework-specifications.md.

Start with M0 and M1 from docs/16-implementation-roadmap.md: a reproducible
TypeScript/React/Vite foundation, renderer capability proof, and one convincing
Gold Willow from placement through afterglow. Include pointer cancellation,
keyboard/no-hold alternatives, resource admission, shared wind, smoke relighting,
audio activation/mute, pause/background behavior, and disposal in this slice.

Use Three.js behind a renderer adapter. Evaluate WebGPURenderer and forced
WebGL 2 with the actual instanced trails, smoke and bloom. Do not assume advanced
compute is portable. Record the result and choose a validated fallback if needed.
Keep simulation and particle arrays outside React. Use fixed time, seeded events,
typed-array pools, bounded secondary generation, and shared capacity management.

Use the documented proposed defaults rather than reopening settled product
questions. Numeric tuning is provisional, not measured truth. Do not remove
agreed features or silently change the realism target to confetti/CSS particles.
Do not add accounts, databases, paid APIs, ads, native Android work, private wedding
data, or unrelated features.

After the hero quality and parity gate, continue through the catalog, director,
UI/audio refinement, performance/PWA hardening, and release gates as authorized.
Use real evidence. Never claim smoothness, offline readiness, asset rights,
flash-safety conformance, or a deployed release without testing/verification.

Commit completed work in coherent batches. Update status, decisions, requirement
traceability, and evidence together. Report the branch/commit, implemented
behavior, commands actually run, tests passed/failed/unrun, and next concrete
work. If a required device or deployment permission is missing, continue all
unblocked work and name the limitation rather than inventing results.

Deploy only to an authorized hosting target. Preserve existing account/domain
settings. A final handover must include the exact verified source commit and
live URL when deployment was actually completed.
```

## First working slice acceptance checklist

The scene loads; Gold Willow can be selected and positioned; the fuse only commits once after deliberate input; accessible controls complete the same action; ascent transitions without teleportation; the gold canopy has actual trajectory-linked decaying trails; a second burst lights persistent smoke; audio respects user activation and mute; manual/display pause works; the app recovers from hide/resume; resource counts stay bounded; and both selected render paths have evidence.

Stop calling the hero complete when it only emits a colored sphere. A quality gate is satisfied by a full interaction recording, technical results, and owner/art review, not a static screenshot alone.

## Work-session handover format

Record: objective, current branch/commit, files changed, requirements addressed, visible outcomes, test commands and outputs, unrun physical checks, known issues, irreversible external changes (if any), and next dependency. Keep PROJECT_STATUS current. Put large raw evidence in the designated evidence location, not inline in the main README.

## Owner choices not required for M0/M1

Final brand/domain, professional audio budget, commercial code license, transparent wedding-stream integration, and secondary language. Defaults are already in the decision register; the engineering work should not stall on these.
