# Documentation map

Baseline: 15 September 2026. Audience: Samir, designers, implementation agents, engineers, and testers.

## Current application and delivery

The active application is the ten-effect **Grand Collection**, currently deployed as graphics-recovery waterfront build `2026-09-29.6` at [Cloudflare production](https://firecrackers.mainandmany.com/). Following the owner's authorized promotion, **main is the canonical integration baseline**; `feat/grand-collection` is retained as delivery history. Use the [current project status](../PROJECT_STATUS.md), [current production receipt](evidence/graphics-recovery-production-release-2026-09-29.md), [preview evidence](evidence/graphics-recovery-preview-2026-09-29.md), [prior `.5` receipt](evidence/pad-launch-production-release-2026-09-29.md), [realism production receipt](evidence/realism-production-release-2026-09-29.md), [image-guided comparison record](evidence/realism-refinement-2026-09-29.md), [earlier waterfront release evidence](evidence/waterfront-delivery-2026-09-29.md), [Cloudflare release evidence](evidence/cloudflare-production-2026-09-29.md), [main promotion audit](evidence/main-promotion.md), [Grand Collection plan](grand-collection/PLAN.md), [completion checklist](grand-collection/DELIVERY_CHECKLIST.md), [verified delivery](evidence/grand-collection-delivery.md) and [machine-readable results](evidence/grand-collection-results.json) before the historical baseline below.

The [retained `.5` preview](https://firecrackers-pad-preview.allygym-api.workers.dev/) remains available for comparison. [Candidate evidence](evidence/pad-launch-preview-2026-09-29.md) and [production evidence](evidence/pad-launch-production-release-2026-09-29.md) cover transparent icon controls, immediate next-launch readiness and positional drag-to-terrace rockets.

The retained [`.6` graphics recovery preview](https://firecrackers-graphics-preview.allygym-api.workers.dev/), its [hosted checks](evidence/graphics-recovery-preview-2026-09-29.md), and the [production receipt](evidence/graphics-recovery-production-release-2026-09-29.md) cover independent art loading and sustained-renderer-stall recovery. The [public `.5` diagnosis](evidence/graphics-loading-diagnosis-2026-09-29.md) explains why particle budgets were kept bounded.

The original five effects remain under Classics; five newer effects are under Grand collection. The current interaction is single-press launch, not the earlier hold-only prototype. Public-site verification and qualification boundaries are recorded separately from planned acceptance criteria. Older V2/V3 and recovery evidence remains historical rather than proof of a later build.

## How to read the specification

**Confirmed** means explicitly requested or accepted in the planning conversation. **Proposed default** means a concrete implementation choice introduced to make the brief buildable. **Validation gate** means evidence is still required. **Deferred** means outside V1. Numbers in the effect and performance specifications are tuning targets, not measurements of a running application or instructions for real fireworks.

Authority order: later explicit owner decisions, then the decision register and requirements, then specialist specifications, then example configuration. Record conflicts before changing the product. A safety or browser limitation must be documented even when it qualifies earlier conversational shorthand.

## Product and experience

1. [Product brief](01-product-brief.md) — goal, audience, scope, and quality bar.
2. [Requirements and acceptance](02-requirements-and-acceptance.md) — testable V1 obligations.
3. [Decisions and open questions](03-decisions-and-open-questions.md) — confirmed direction, defaults, corrections, and remaining owner choices.
4. [Firework specifications](04-firework-specifications.md) — the five identities and their complete visual timelines.
5. [Interaction and user journeys](05-interaction-and-user-journeys.md) — picking, placement, ignition, interruption, and recovery.
6. [Art direction and realism](06-art-direction-and-realism.md) — scene, light, smoke, camera, and reference review.
7. [Design system and motion](07-design-system-and-motion.md) — responsive composition, controls, accessibility, and motion tokens.
8. [Audio and haptics](08-audio-and-haptics.md) — event-based sound, mixing, timing, and device limitations.
9. [Auto-show and display mode](09-auto-show-and-display-mode.md) — paced sequences, manual takeover, and decorative use.

## Engineering and delivery

10. [Technical architecture](10-technical-architecture.md) — modules, renderer selection, boundaries, and state.
11. [Simulation and rendering](11-simulation-and-rendering.md) — implementation algorithms and render pipeline.
12. [Performance and compatibility](12-performance-and-compatibility.md) — bounded resource budgets and quality management.
13. [PWA, offline, and lifecycle](13-pwa-offline-and-lifecycle.md) — installation, cache updates, suspend, and recovery.
14. [Accessibility, privacy, and safety](14-accessibility-privacy-and-safety.md) — operability, flash reduction, and public-data boundaries.
15. [Assets and licensing](15-assets-and-licensing.md) — original asset briefs, inventories, and provenance gates.
16. [Implementation roadmap](16-implementation-roadmap.md) — dependencies and independently reviewable milestones.
17. [Test and release plan](17-test-and-release-plan.md) — scenarios, evidence, and release blockers.
18. [Deployment and operations](18-deployment-and-operations.md) — static hosting, preview, release, rollback, and maintenance.
19. [Research and reuse](19-research-and-reuse.md) — verified primary sources, reusable components, and limits of evidence.
20. [Implementation handover](20-implementation-handover.md) — a ready-to-use development prompt and first milestone.
21. [Risk register](21-risk-register.md) — mitigations and triggers.
22. [Requirements traceability](22-requirements-traceability.md) — requirement-to-document, milestone, and test mapping.

The full baseline also includes machine-readable specifications under `specs/`, visual tokens under `design/`, and repository-level status and contributor instructions. Documents linked here are delivered as a coordinated baseline; consult Git history for the completed set.

## Fast reading paths

For the product owner: 01 → 03 → 04 → 06 → 16. For implementation: 02 → 05 → 10 → 11 → 12 → 17 → 20. For designers: 04 → 06 → 07 → 08 → 15. For release review: 14 → 17 → 18 → 21 → 22.

A planning document alone is not implementation evidence. Planned tests remain unrun until an evidence record identifies the build, environment, and results; current executed results are linked at the top of this index.

## Waterfront upgrade

The deployed `.3` build retains the open central stage and drag-to-burst, and refines the waterfront. See [its release receipt](evidence/realism-production-release-2026-09-29.md), [editable asset provenance](../assets-source/PROVENANCE.md), [concept review](../assets-source/DESIGN.md), and [three image studies with twelve browser comparisons](evidence/realism-refinement-2026-09-29.md). Earlier deck and hold-to-ignite documents describe historical decisions superseded by the approved implementation.
