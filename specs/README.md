# Machine-readable planning specifications

All configurations are proposed starting values, not an implemented engine or calibrated real-world fireworks model. They contain animation timing, normalized composition, and software-resource budgets only.

## Files

- `fireworks.v1.json`: five stable selectable IDs and family-specific timing/topology. Validated by `fireworks.schema.json` plus cross-field checks in the documentation validator.
- `quality-budgets.v1.json`: finite Low/Standard/Ultra resource ceilings and adaptation targets.
- `show-presets.v1.json`: distinct show-level IDs, weights, pacing, and cue limits. A Finale show is not the Grand Finale effect.
- `asset-manifest.template.json`: an empty inventory and example record fields. It does not claim any media is acquired or approved.
- `../design/tokens.json`: semantic UI tokens and interaction defaults.

## Conventions

Seconds for animation time; milliseconds only where the field name says `Ms`; CSS pixels for UI; world coordinates defined by the engine; normalized screen composition measured from the bottom for `burstYNormalized`. Radius uses the smaller viewport dimension. Arrays named as ranges contain two ordered endpoints. All values must be finite and clamped by runtime validation.

Per-family emitter counts request primary heads. Global tier budgets separately bound heads, trail segments, secondary fragments, smoke, light envelopes, and audio. Grand Finale costs three admission units and reserves its bounded child schedule. Low-tier topology reductions must happen before ignition, not by deleting required split children mid-flight.

## Authority and versioning

Confirmed product decisions and testable requirements outrank sample configuration. If tuning changes a value, update the appropriate specialist document and bump the configuration version together. Stable effect IDs should not change because the consumer-facing name is rebranded. Keep schema migrations explicit and reject unknown executable content.

The documentation validator verifies structural consistency. Runtime code must independently validate user/storage/network inputs and enforce peak reservations; schema success alone cannot prove allocation safety or rendering quality.
