# 21 — Risk register

Assessment: qualitative planning judgments, not observed failure probabilities. Owner means the proposed implementation responsibility, not an assigned employee. Review at each milestone.

| ID | Risk / trigger | Impact | Mitigation and gate | Owner |
|---|---|---|---|---|
| R-01 | Preferred renderer/custom nodes fail on WebGL 2 | Critical | M1 parity spike; adapter boundary; validated baseline before expansion. | Rendering |
| R-02 | Visually generic confetti despite many particles | High | Gold Willow full-timeline art gate; trajectory-linked trails; structured family specs. | Art + rendering |
| R-03 | Smoke overdraw causes mobile stutter | High | Half/quarter-resolution effects, bounded impostors, opacity budget, real-device profiling. | Rendering |
| R-04 | Infinite show accumulates particles/audio/timers | Critical | Fixed pools/reservations, max cue horizon, cleanup tests, two-hour soak. | Engine |
| R-05 | Hidden-page return fires old bursts/sounds | High | Frozen simulation clock, canceled audio generation, explicit resume. | Platform + audio |
| R-06 | Thermal/power pressure degrades sustained display | High | Conservative pixel caps, 30 FPS mode, rolling adaptation, no invented temperature readings. | Performance |
| R-07 | Gesture is satisfying but inaccessible or unreliable | High | No-hold/placement alternatives, pointercancel tests, enlarged fuse hit target. | UX + input |
| R-08 | Bright overlap/crackle produces problematic flashes | Critical | Global intensity envelope, reductions before first launch, assessed worst-case sequences, gate release. | Rendering + accessibility |
| R-09 | Audio clips or surprises users | High | Sound initially off, user activation, voice/headroom budget, mix peak and listening review. | Audio |
| R-10 | Media lacks commercial/redistribution rights | Critical | Per-asset provenance, approved-only release inventory, no video/audio ripping. | Asset owner |
| R-11 | Offline badge is false or assets are evicted | High | Cache-manifest verification, partial-cache state, quota/eviction tests. | PWA |
| R-12 | Worker update mixes old/new app assets | Critical | Prompt update, versioned caches, old-client tests, rollback recovery. | PWA + release |
| R-13 | Hidden glass controls prevent pause/exit | High | Reveal affordance, focus-triggered display, consume reveal tap, keyboard/zoom tests. | UX |
| R-14 | Finale recursively spawns or bypasses caps | Critical | Separate effect/preset IDs, one generation, topology schema, reserved peak cost. | Engine |
| R-15 | Documentation defaults mistaken for owner approvals or measured facts | High | Decision status labels, explicit unrun evidence, traceability and config versioning. | Maintainer |
| R-16 | Brand/domain/media budget delays all engineering | Medium | Working defaults; defer non-blocking owner questions until relevant release gate. | Product |
| R-17 | Public repo receives secrets or wedding/private data | Critical | No backend keys needed; review commits/asset metadata; scope to this repo only. | Maintainer |
| R-18 | Automated browser tests overstate physical device support | High | Separate automation and real-hardware evidence; name unrun targets. | QA |
| R-19 | Future transparent livestream mode breaks alpha/bloom | Medium | Defer integration, preserve presentation boundary, separate compositing/performance spike. | Rendering |
| R-20 | Dependency upgrades invalidate shaders or PWA behavior | High | Lock versions, isolated upgrades, repeat parity/lifecycle/update tests. | Maintainer |

## Escalation rules

A critical risk discovered in implementation blocks the affected release gate. Keep working on unrelated tasks, but do not hide it behind an average score. Renderer failure must not remove user controls. Licensing uncertainty blocks shipping that asset. An unassessed intense flashing sequence is not approved simply because a reduced-flash option exists.

Change one high-risk subsystem at a time after the hero baseline. Record the triggering scenario, exact commit, rollback/refinement choice, and residual limitation. Do not silently remove a required effect to make the test count green.
