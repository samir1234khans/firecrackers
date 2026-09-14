# Documentation map

Baseline: 15 September 2026. Audience: Samir, designers, implementation agents, engineers, and testers.

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

No document is evidence that the application has already been implemented. Planned tests remain unrun until an evidence record identifies the build, environment, and results.
