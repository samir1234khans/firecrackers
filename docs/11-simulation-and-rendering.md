# 11 — Simulation and rendering implementation specification

## Coordinate and time conventions

Use right-handed world coordinates with Y upward, a stable camera looking into the scene, and seconds for all simulation time. World units are artist-defined; do not mix CSS pixels with simulation velocities. UI-normalized placement is converted through a known ground-plane mapping. `burstY` in catalog configuration is bottom-origin normalized screen composition, not world height.

The engine owns one fixed timestep, initially 1/60 second, with an accumulator and a maximum of four simulation substeps per render frame. Clamp a resumed/stalled frame's delta and suspend rather than attempting minutes of catch-up. Rendering may interpolate between simulation states. A 30 FPS tier still runs the same conceptual simulation timeline using bounded substeps; it does not double gravity or fuse duration.

Use independent seeded random streams for choreography, each firework, audio selection, and cosmetic variation. A render-only fluctuation must not change future show scheduling. Reproduce event order and bounded properties, not exact floating-point pixels across different GPUs.

## Firework lifecycle

Each admitted firework stores ID, seed, family, phase, phase start, transform, reserved cost, emitter handles, and pending bounded secondary events. Transitions are `fuseBurning → ascent → primaryBurst → secondary/decay → complete`. Secondary and decay can overlap, so do not force all particles through a single global phase enum. Completion requires no live emitters or scheduled children and a release of its reservation; retained smoke belongs to the EnvironmentSystem after emission.

A first-party small state machine is sufficient. Transitions are explicit and unit-tested. A firework cannot re-enter primaryBurst after completion or generate secondary descendants beyond the configured generation count.

## Ascent and spark motion

Use a smooth thrust envelope for the main ascent, then drag and gravity. Avoid a ballistic formula that produces a discontinuous jump when switching from launch animation to particle motion. The burst center/velocity must come from the actual ascent state, with composition correction handled before launch rather than teleporting to a target.

A baseline head integrator can use semi-implicit Euler:

```text
relativeVelocity = velocity - localWind
acceleration = gravity + thrust - drag * relativeVelocity
velocity += acceleration * dt
position += velocity * dt
```

This is a visual approximation with artist-tuned units, not a physical model of a real shell. For simple free sparks under constant gravity/wind and linear drag, an analytic solution may be shared between CPU reference tests and shader positions. Branch explicitly near zero drag to avoid unstable division. Turbulence must be low amplitude, smoothly correlated, and independent of render frame rate.

At a spherical burst, sample directions approximately uniformly over solid angle, not uniformly in latitude. One proposed method samples z uniformly in [-1,1] and azimuth uniformly in [0,2π), then derives the remaining components. Apply bounded seeded distortion and per-star speed/lifetime variation. Rotate the entire sampled pattern per launch to prevent visible repeated rings. Preserve radial separation and depth rather than flattening all points into XY.

## Trails and spark appearance

Maintain bounded history for emitter heads or analytically evaluate historical positions. Render trails as instanced camera-facing segments/ribbons with head-to-tail width, age fade, and brightness variation. Use world trajectory history, never a straight screen-space line glued behind the current sprite. Detach sparse secondary sparks from historical positions with their own short lifetimes.

Separate luminous heads, trail samples, and decorative spark fragments in the budget. Store attributes in structures of typed arrays with reusable free lists or ring buffers. Do not allocate new Vector3 objects or geometries for every spark every frame. Batch by material and use per-instance data for color/age/size/seed.

Use frame-rate-independent fading, for example an age curve or exponential decay based on elapsed time. An update such as `alpha *= 0.98` once per render frame is not acceptable. Avoid abrupt alpha clipping that makes a whole canopy disappear in one frame.

## Family-specific algorithms

Gold Willow uses long-lived radial heads with strong visual droop and tapering historical trails. Peony uses a denser spherical star field with minimal trails and quicker extinction. Chrysanthemum preserves long enough trails to trace outward spokes without adopting Willow's long hanging canopy.

Crossette allocates a bounded set of parents and schedules one split per parent. Children spawn at the parent's current position and inherit velocity plus a rotated four-direction local separation. Transfer the parent's remaining energy into child brightness smoothly; do not leave both full-bright parent and children indefinitely. Secondary crackle is a separate bounded emitter layer.

Grand Finale holds a precomputed child schedule within a single admitted composition. Child groups reuse existing generators. They have distinct positions/velocities and bounded delays, one generation only, and a projected overall envelope. Reserve peak cost, not the sum of every historical particle. Conservative estimates may reduce optional child density before ignition.

## Smoke

Baseline: pooled soft depth-aware impostors with evolving scale, density, rotation, wind advection, and deterministic noise offsets. Use premultiplied alpha consistently if chosen; verify texture preparation, blend state, and output to avoid dark fringes. Partition smoke into coarse depth bins for stable approximate sorting, or adopt a tested alternative. A single giant additive smoke sprite is not acceptable.

Emit smoke at fuse, ascent tail, and burst; use distinct scales/lifetimes. Standard target smoke persistence is roughly 6–18 seconds depending on source. Density decreases with age and expansion, and a global opacity budget prevents cumulative fogging. Reuse the least visible old smoke slot under pressure. Smoke and additive sparks need deliberate depth/compositing order so every ember is not always on top.

Burst lighting is approximated using a small pool of position/color/radius/decay envelopes. Select the most relevant few for smoke shading rather than instantiating a shadow-casting Three light per star. Clouds and haze respond at lower intensity. True ray-marched volumes, fluid dynamics, and per-particle shadows are outside the baseline.

## Frame pipeline

1. Apply validated commands and simulate bounded fixed steps.
2. Produce semantic events and update reservations/quality observations.
3. Update pooled instance buffers and environment uniforms.
4. Render sky and distant horizon; compose depth-aware smoke and luminous particles in the tested order.
5. Apply bounded emissive bloom at a lower resolution; tone-map and convert for display.
6. Composite DOM UI separately; update only low-frequency light/quality signals.

Verify the actual node/post-processing path against the locked Three version; do not mix a legacy WebGL EffectComposer with an incompatible WebGPU setup. Limit render targets, avoid repeated full-resolution blur, and avoid a render pass per firework. Resize disposes old targets before allocating replacements and respects the pixel budget.

## Admission, resource loss, and cleanup

An admission plan selects a quality-specific family topology and reserves all required pools before fuse commitment. Resource counts include future children. When pressure rises, reduce future secondary detail and upcoming overlap. Preserve active primary silhouettes; never break the promised four-way split by randomly dropping children after ignition.

Handle startup failure, WebGL context loss, and WebGPU device loss through the renderer adapter. Pause first, stop audio/haptics, dispose safely, and rebuild once at a conservative tier. A persistent failure yields an operable static scene with retry. No infinite recovery loop.

Dispose materials, textures, geometries, targets, audio handles, observers, event subscriptions, pointer capture, and animation-loop handles on shutdown. Repeated enter/exit cycles must leave no cumulative count increase.

## Implementation proof

The hero spike must demonstrate actual trajectory-linked trails, smoke lit by a second burst, backend parity, an admission cap, deterministic event tests, pause/resume, and complete disposal. A video playing on a canvas, CSS particle animation, or generic confetti library does not satisfy this requirement.
