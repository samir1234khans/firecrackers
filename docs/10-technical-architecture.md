# 10 — Technical architecture

## Architecture decision

Build a client-only TypeScript web app with React for semantic controls and lifecycle orchestration, Vite for bundling, and Three.js for the scene. Use Web Audio directly, browser feature adapters, and a service-worker/PWA integration. No application server, database, account service, or paid runtime API is required for V1.

Three.js WebGPURenderer is the preferred candidate because its documented backends include WebGPU and WebGL 2; `forceWebGL` enables explicit fallback testing. TSL offers a common shader representation. These statements do **not** establish feature parity for arbitrary compute code. Sources: [S01–S03](19-research-and-reuse.md). The first engineering milestone must prove the actual materials, instancing, smoke, and bloom on both paths before the renderer choice is locked.

If that spike fails, record an ADR and ship the hero on a validated WebGL 2 implementation behind the same renderer boundary. Do not keep a black-screen fallback to preserve a technology label. A WebGPU-only experiment must remain optional.

## Main module boundaries

| Module | Owns | Must not own |
|---|---|---|
| AppShell | React overlays, preferences UI, capability notices, lifecycle hooks | Particle arrays or per-frame simulation state |
| InputController | Pointer/keyboard state, placement, deliberate ignition, command validation | Sound scheduling or renderer internals |
| SimulationEngine | Fixed clock, firework state machines, emitter pools, event queue, seeded randomness | DOM, network, React hooks |
| EffectCatalog | Validated family definitions and versioned presets | Unbounded arbitrary script execution |
| ShowDirector | Future cues, pacing history, manual arbitration | A second particle engine |
| ResourceManager | Reservations, pool limits, quality transition policy | Deleting already accepted effects without a recovery policy |
| RendererAdapter | GPU initialization, geometry/materials, draw/update, resize, disposal | Product-state decisions or fetching personal data |
| EnvironmentSystem | Wind, bounded smoke, cloud motion, burst-light envelopes | Independent contradictory randomness |
| AudioEngine | Activated context, decoded samples, event timing, mix, cleanup | Browser autoplay assumptions |
| PlatformServices | Wake lock, fullscreen, visibility, optional vibration/storage | Claims that unsupported APIs succeeded |
| Diagnostics | Local counters, deterministic scenario playback, perf sampling | Default remote analytics |

## Commands and events

Commands are validated intentions: `SelectFirework`, `SetPlacement`, `BeginIgnition`, `CancelIgnition`, `CommitIgnition`, `Pause`, `Resume`, `SetShowPreset`, `StartShow`, `StopShow`, `SetPreferences`, and `Reset`. Admission returns accepted/rejected plus a user-safe reason. A rejection never queues an undisclosed future action.

Events contain `eventId`, `sessionId`, `simulationTime`, `fireworkId` where relevant, `seed`, source position, family ID, and a typed payload. Semantic types include `fuse.started`, `launch.started`, `burst.primary`, `burst.secondary`, `effect.completed`, `capacity.changed`, and `engine.error`. Sparks themselves do not generate DOM or application-level events. Each subsystem deduplicates events where retry/recovery could expose the same event twice.

Simulation commands are applied at fixed-step boundaries; important UI acknowledgments may be immediate, but the engine remains authoritative about commitment. The UI subscribes to a compact snapshot at meaningful transitions or a modest rate, not 60 particle-array copies each second.

## Proposed future source layout

```text
src/
  app/                 # React root, overlays, boundaries
  ui/                  # Dock, controls, settings, help
  input/               # Pointer and keyboard adapters
  engine/
    clock/             # Fixed timestep and pause
    catalog/           # Validated effect definitions
    simulation/        # Fireworks, emitters, pools
    director/          # Auto-show scheduler
    resources/         # Reservations and quality
    environment/       # Wind, smoke and transient light
    rendering/         # RendererAdapter and TSL/material code
    audio/             # Event scheduler and mix
  platform/            # Fullscreen, wake lock, storage, lifecycle
  diagnostics/         # Dev-only scenario harness
  assets/              # Bundled visual/audio imports
  styles/              # Generated/consumed semantic tokens
public/
  icons/               # Install icons and manifest assets
  media/               # Versioned static assets when not bundled
specs/                 # Baseline configuration and schema
 tests/                # Unit, integration and E2E suites
```

The above is a plan; the documentation baseline does not contain this runtime tree.

## Startup and dependency loading

Render accessible startup controls immediately. Load the scene bundle and critical hero assets; initialize the selected backend asynchronously; compile/warm key materials before accepting ignition. Load optional audio only when relevant and account for offline readiness separately. Avoid importing the entire icon library or loading every high-resolution asset before the first interaction.

Record exact stable package versions in a lockfile during implementation, after checking official compatibility documentation. Do not copy floating version claims from this document. Commit the runtime/toolchain version file and package manager configuration with the scaffold. The current Vite guide is the source for its supported Node requirements: [S15](19-research-and-reuse.md).

## Rendering boundary

Use a minimal interface: initialize, set viewport, update scene inputs, render, get capability/status, and dispose. Renderer-specific resources never leak into product requirements or persisted preferences. Resource loss transitions the app into recovery rather than throwing the user into an empty canvas. Startup fallback and mid-session recovery are different code paths and both need tests.

Baseline simulation uses CPU-authored events/emitter heads with bounded typed arrays and GPU-instanced drawing. Analytic shader motion may advance simple ballistic fragments with matching CPU reference logic. Advanced GPU compute can be introduced only when it preserves required fallback behavior or is explicitly optional. Do not assume atomics, storage buffers, indirect draws, or a compute example automatically work on WebGL 2.

## State and storage

Persist only a versioned preference object: selected family, sound intent/volume, ambience, haptic preference, quality preference, reduced-motion/flash choices, last show preset, and help completion. Do not persist live fuses, scheduled audio, wake-lock tokens, current fullscreen state, or graphics adapter fingerprints. Startup is calm and does not auto-resume an old show.

Runtime data stays in memory. Audio/texture assets use browser caches, not a database. A schema-validation failure falls back to a known safe catalog/configuration and presents an actionable error in development. Untrusted URL parameters cannot supply executable effect definitions.

## Failure isolation

A missing optional sound must not stop rendering. A failed renderer must not remove pause/mute/retry controls. A rejected wake-lock request must not crash the show. Corrupt local preferences must not stop startup. Failed asset fetches have bounded retry and cancellation. Cleanup is idempotent so React development remounting does not create multiple render loops or audio contexts.

## Dependency discipline

Reuse React, Three.js, Vite, the PWA plugin, test tools, and a small icon set. Prefer CSS transitions for simple interface motion; add Motion only if measurable interaction complexity warrants it. React Three Fiber, full UI frameworks, physics engines, state-management frameworks, and audio wrappers are not baseline requirements. Each added package needs a concrete benefit, bundle cost, license record, and lifecycle owner.
