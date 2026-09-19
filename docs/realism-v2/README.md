# Firecrackers — realism and experience upgrade

Research and planning revision: 16 September 2026.

This is an implementation-ready upgrade specification, not a claim that the new graphics have been built. It preserves the working application and its five firework families.

## Read in this order

1. [Master upgrade plan](MASTER_PLAN.md): source audit, final visual direction, ignition-to-residue sequence, 3D rendering, effects, UI, audio, stream integration, budgets, phases and decisions.
2. [Acceptance tests and delivery backlog](ACCEPTANCE_AND_BACKLOG.md): evidence gates, task dependencies, regression protection and release criteria.
3. [Research and open-source register](RESEARCH_REGISTER.md): primary sources, exact reuse recommendations, compatibility cautions and licensing boundaries.
4. [Implementation handover](IMPLEMENTATION_HANDOVER.md): executable work brief for the next engineering session.
5. [Proposed quality configuration](quality-targets.proposed.json): explicitly unmeasured starting budgets. This is NOT consumed by the current application.

## Source boundary

Audited runtime: `feat/fireworks-v1` at `5aafb8033fbfb231518efbb73d1fa2141ff53977`, with Three.js `0.180.0`. On the research date, `main` was `7603a2c63ef1f4e36e4c1d845915632640d83369`; `feat/fireworks-v1-implementation` was `16d9d1d8056ff6cb1d47b7fff92c3731395efdce`. The two feature branches diverge. Do not treat the similarly named branch as a newer, interchangeable implementation. Refetch all refs before work.

The working preview was previously recorded at https://firecrackers-a93nle.v2.appdeploy.ai/ . This planning package does not replace or redeploy it. Current application evidence remains in [the runtime record](../evidence/runtime-implementation.md).

## What this delivery contains

A source-grounded audit, current primary-source research, a selected technical path, open-source reuse decisions, an asset-production brief, proposed quality budgets, a prioritized backlog, and acceptance tests. It does not contain new shaders, new 3D models, smoke bakes, finished audio, runtime benchmarks, physical-device tests or a new production deployment.

Preserve existing source, documentation, accessibility, offline capability, bounded pools, pause/recovery, manual show priority and sound-off defaults. No force pushes, branch deletion, licensing changes, personal wedding data or production promotion are part of this documentation delivery.
