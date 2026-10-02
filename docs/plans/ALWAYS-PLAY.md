# Always Play — four-pace endless autoplay

Status: historical implementation plan, 2 October 2026. Delivered in build `2026-10-02.3` through PR #32. The [production receipt](../evidence/always-play-2026-10-02/PRODUCTION.md) records actual delivery, owner-shortened testing and remaining qualification limits; numerical targets below remain planning targets.

## 1. Product decision

Add **Always Play** to Shows, with four quantity levels: **1 Low, 2 Medium, 3 High, 4 Super High**. Once explicitly started, it continues until the user stops it, takes manual control, or an interruption requires recovery. “Always” means no scheduled ending while the app is active; it does not mean background execution or automatic playback on page load.

Default to Medium for first use. Remember the last selected pace when storage is available, but never remember a running session. All thirteen catalog effects participate. Pace changes the frequency and overlap of launches, not the speed of flight, particle evolution, water, or the simulation clock.

The intended distinction is clear: Low lets individual identities breathe; Medium feels festive; High maintains overlapping action; Super High produces a sustained, densely layered celebration with brief breathing space. The waterfront, reflections and effect silhouettes must remain readable.

## 2. Verified baseline and constraints

Fetched `origin` and inspected the clean worktree on 2 October. Planning starts from main `f324f3ac8befb69e1fb86641bedcdb1dd0ba2646`. Its runtime is the released main merge `dd625594b3d051defe34a76807d69234d20ce695`. Public `release.json` was independently fetched and reports build `2026-10-01.11`, fingerprint `b7687fa6f916f5b3dd391d17d9646888314001a728296313961275001f7b3d45`. See the [production receipt](../evidence/moonlit-water-2026-10-01/PRODUCTION.md).

Source findings relevant to this design:

| Existing behavior | Consequence for Always Play |
| --- | --- |
| [Simulation](../../src/engine/Simulation.ts) keeps Calm and Festival running; Finale stops after 32 simulation seconds | Preserve those three identities. Endless duration alone does not distinguish the new mode; user-controlled quantity does. |
| Calm requests cues every 7–10 seconds; Festival uses 3.2–6.2 seconds before family/haze adjustments; Finale uses 1.5–2.5 seconds | New four-pace scheduling should have its own explicit configuration, leaving existing timing and seeded behavior intact. |
| Auto admission can overlap rockets; manual admission requires no committed fuse/ascent | Multiple launch capability already exists. Preserve manual input and its immutable committed flight rather than inventing a parallel launch mechanism. |
| [Catalog](../../src/engine/catalog.ts) caps pre-burst units at 3 on Low and 6 on Standard/Ultra; effects cost 1–3 | Super High cannot promise identical density on every device or during every heavy effect. Do not raise these caps merely to meet a label. |
| Head pool capacity is 3072, with existing stars plus unborn children reserved before admission | Include the entire future composite cost. Opal reserves 980 heads; Signature effects reserve 640–720. A rocket count is not a sufficient load estimate. |
| Trails cap at 12000/20000/24000; smoke at 32/64/96; embers use a 768-capacity pool | Assess residue and trail pressure as well as pre-burst units. Increasing overlap must not cause long-tail effects to disappear. |
| Reduced flashes defaults to enabled, and current show spacing has a 3-second floor | Clearly qualify the high-quantity targets below as full-effects proposals. Comfort settings retain priority; never disable them on choosing a pace. |
| [ShowModeKnob](../../src/ui/ShowModeKnob.tsx) has four directional gestures, including Manual | A fifth mode must not be accidentally mapped onto an existing direction. Preserve gestures; expose Always Play explicitly in the dialog. |
| Current immersion hides ordinary chrome and retains one reveal button | Extend the same behavior to Always Play; no additional permanently visible pace/status controls. |

These are source observations, not evidence that the proposed workload already performs well.

## 3. Four pace contracts

Initial tuning targets for warmed Standard/Ultra rendering with adequate headroom and reduced flashes off. Count **admitted primary rockets**, not their secondary bursts. Measure over five active minutes after a 30-second warm-up; report requested and admitted counts separately. These ranges are hypotheses to qualify, not guaranteed throughput.

| Level | Label | Initial average target | Choreography and visible feel |
| --- | --- | --- | --- |
| 1 | Low | 6–9 rockets/minute | Mostly single launches, roughly 7–10 seconds apart, long tails and moonlit pauses. |
| 2 | Medium | 14–20 rockets/minute | Singles and occasional staggered pairs; roughly 3–4 seconds per rocket on average. Clear opening and closing moments. |
| 3 | High | 30–40 rockets/minute | Frequent alternating launches and pairs, with 1.5–2 seconds average spacing. Usually overlapping main bursts, distinct colors and silhouettes. |
| 4 | Super High | 50–65 rockets/minute | Near-continuous action, pairs and occasional three-rocket phrases; approximately 0.9–1.2 seconds average spacing. Short low-cost connectors between featured heavy effects. |

“Average spacing” includes phrase rests; it is not a metronomic interval. Initially cap requested full-effects inter-launch spacing at no shorter than 0.75 seconds, at most one admitted auto rocket per fixed tick, and at most three planned primary rockets in a phrase. Tune these values only against recorded results. All existing global caps still apply.

Low quality, Canvas, reduced flashes, capacity pressure and viewport constraints may deliver fewer rockets. Keep the chosen level visible as the user's intent; do not secretly relabel it. When sustained limiting occurs, show one restrained explanation in the open Shows panel: “Super High · adjusted for smooth playback” or “High · reduced flashes”. No per-launch warnings or repeated live announcements.

For a fixed backend/tier/comfort configuration, each successive level must produce a measurably fuller experience. If High and Super High converge under hard limits, improve cost-aware selection and phrasing, or explicitly qualify that tier as limited. Do not claim a four-level distinction based solely on different requested timers.

## 4. Choreography and variety

Use bounded musical phrases rather than a repeated all-at-once burst. Example Super High phrase: warm single, cool single about one second later, two short staggered accents, then a featured Signature with lighter connectors. A heavy composite can stand alone while its own children fill the sky. Phrase durations begin around 12–20 seconds, with a small lull every 30–45 seconds; these are artistic proposals.

- Use an independent deterministic director RNG. Preserve current launch, placement, smoke and legacy show streams. Identical seed, inputs and budget feedback must reproduce the same director decisions.
- Maintain a fixed-size shuffled bag of thirteen family IDs. Consume an entry only after successful admission; avoid adjacent identical families. Permit an inexpensive connector while waiting for a featured family, without removing or repeatedly resetting the blocked bag entry.
- All thirteen families must appear during a ten-minute unconstrained Standard/Ultra run at every pace. If a heavy family is repeatedly blocked, reserve an upcoming solo feature slot and wait for capacity to clear; do not starve it forever. There is no guarantee during a short run or continuing user interruption.
- Favor short-lived Classics as connectors, and give Opal, Grand Finale and Signatures feature space. Initial heavy-feature separation: Low 20 seconds, Medium 15, High 10, Super High 8, or longer when admission/comfort requires. Do not repeatedly layer two long golden canopies in the same region.
- Resolve placement using the existing fixed/random preference. Fixed remains fixed. When Random is selected, use valid, alternating terrace positions with actual launch-profile bounds and center-protection rules; do not force random placement without consent.
- Preserve original size, color, child count and catalog identity. Do not make Super High look busier by cloning secondary bursts recursively or accelerating effect time.

## 5. Controls and interaction

Keep the existing four directional shortcuts for Manual, Calm, Festival and Finale. Add a clearly named **Always Play** row inside the Shows dialog. On selecting it, reveal a compact four-choice pace control and an explicit **Start Always Play** action. Merely opening the panel or highlighting the mode does not launch anything.

Conceptual panel:

```text
Always Play
Keep the night going until you stop it.

1 Low    2 Medium    3 High    4 Super High

Start Always Play
```

While running, show the selected pace and **Stop Always Play**. A new pace applies on selection without a stop/restart. Pace is a native radio group with arrow-key navigation, programmatic selection state and clear accessible names. Retain at least the existing 48px hit targets; allow a 2×2 layout on narrow phones. Update selected styling over about 140ms, with zero animation under reduced motion. Do not flash the panel or expose diagnostic numbers to ordinary users.

The existing mode knob can display the infinity icon while Always Play is active. A drag still resolves to the four existing directional modes. Clicking opens the dialog with focus on the active mode/pace. Avoid adding another HUD button or overloading catalog number shortcuts.

Opening the dialog freezes the scene through existing overlay pause ownership. Selecting a pace while it is open changes configuration only; closing resumes if the user had not independently paused. Start is explicit play intent, but an overlay/hidden-page/error block remains authoritative. Cancelling the dialog leaves the running mode and pace unchanged unless the user actually changed them.

## 6. Lifecycle, manual priority and immersion

| Event | Required behavior |
| --- | --- |
| Start | Enter Always Play at saved/default pace; first cue after approximately 0.5 simulation seconds. No automatic sound or fullscreen. |
| Change pace | Keep director session, shuffled bag, airborne rockets, children and water phase; ease scheduling interval to the new target over 2–3 active seconds. No immediate volley or accumulated cue credit. |
| Pause / open overlay | Freeze the clock and complete scene. Keep mode and pace. Resume without catch-up. |
| Hidden page | Freeze and release wake lock via existing lifecycle. Resume according to existing pause intent, never by emitting missed wall-clock launches. |
| Stop / choose Manual | Cancel only unadmitted director cues. Existing rockets, children and tails complete; show ordinary controls. |
| Choose Calm/Festival/Finale | End Always Play scheduling and start the chosen existing show through its current path. Already admitted effects complete. |
| Manual firework selection/launch | Stop auto scheduling at input intent, even when the requested manual launch is currently busy. Let committed flights finish, preserve requested selection, and report readiness. Never silently queue a manual launch or require Stop first. |
| Hide controls | Same opt-in 220ms fade/inert treatment and single Show controls button. Continue playback at selected pace; no HUD wakes on bursts or pointer movement. |
| Show controls / Escape | Reveal chrome without restarting or changing pace. Existing Space behavior pauses and reveals controls; retain keyboard sound handling. |
| Renderer interruption | Freeze scheduling and expose existing recovery controls. Only resume if recovery policy and retained play intent allow; no hidden-error auto launches. |
| Reload / reset | No running session restored. Reset clears all pending cues and returns to existing initial scene behavior. |

Manual priority needs care: today `ignite('manual')` stops a show only after capacity admission succeeds. Always Play must stop at explicit manual input intent before that check. Scope this change to a reviewed input path and test failed/busy taps; do not mutate an already committed rocket. Reserve initial auto headroom of **one unit and 520 heads** where possible, in addition to existing future reservations. This helps ordinary manual admission but does not promise immediate admission of a cost-3 Signature; the ready/busy contract still applies. Permit a solo heavy feature when otherwise empty on Low, where a permanent one-unit reserve would make cost-3 families impossible.

The one-button immersive contract means touch users reveal controls, then pause/stop. Reveal must always be available, visibly focused on keyboard use, and responsive even under Super High load. Do not interpret UI hiding as pausing animated content.

## 7. Bounded scheduling and adaptation

Implement a small `AlwaysPlayDirector` beside Simulation, driven exclusively by its fixed clock. Keep mode (`always`) and `pace: 1 | 2 | 3 | 4` separate. Do not create four unrelated ShowPreset strings, independent requestAnimationFrame loops or unbounded timers.

Preallocate a thirteen-entry bag, a maximum three-entry phrase buffer and numeric rolling counters. Pending director entries have expiry and consume no particle reservation until actual admission. Existing born/committed children retain their reservations and must finish. No growing launch backlog, session-length array, per-frame React updates or repeated per-launch shader compilation.

Admission order:

1. Respect pause, readiness, lifecycle and comfort constraints.
2. Check existing `canReserve`, including active units, live heads and every unborn child.
3. Check proposed soft pressure thresholds: throttle near 75% head/trail occupancy or 80% smoke occupancy. Begin with conservative connector selection and longer gaps rather than destroying live tails.
4. Check auto headroom and phrase/feature rules, then call the existing `ignite('auto', family, placement)` path once.
5. On rejection, retain at most the bounded next feature intent. Retry after 0.5–1.25 active seconds with no busy-spin and no advancing launch/placement randomness. Expire optional accents instead of replaying them later.

Performance feedback must be a compact signal from the existing renderer loop, not a second animation loop. Proposed starting rule: sustained rendered-interval p95 above 33ms for two active seconds reduces auto demand by 15%; recover one step only after ten healthy seconds below 25ms. Use hysteresis, exclude startup/paused/hidden intervals, and impose a minimum useful pace. These timing thresholds are tuning hypotheses, not a hardware guarantee. Existing graphics recovery remains authoritative.

For determinism, feed adaptation into Simulation as explicit timestamped decisions that QA can record/replay; browser load cannot be inferred from simulation time alone. Identical seeds on different hardware need not produce identical admitted counts. Report both scheduling intentions and actual admission outcomes.

Keep renderer reflection targets, quality pools and established draw limits unchanged. Always Play does not raise reflection update rates or quality automatically. Prefer improving density inside those budgets before proposing a separate capacity expansion.

## 8. Comfort, storage and presentation

Reduced flashes remains independent and enabled by default. Initially preserve the existing minimum three-second auto launch interval when it is enabled, and damp reflected burst energy through the existing path. Super High does not toggle this preference off. Composite children and overlapping colored reflections can still create rapid visual transitions: a primary launch timer alone cannot establish flash safety.

Evaluate captures of the **whole rendered frame**, including reflections and saturated red effects, against [W3C WCAG 2.2, Three Flashes or Below Threshold](https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold). This concerns luminance/area/red transitions, not the number of rockets. Record analysis methods and limitations; do not claim conformance from a three-second scheduler floor. Provide explicit pause/stop following [W3C Pause, Stop, Hide guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

Reduced motion retains static water/sky and immediate UI state changes while preserving recognizable effect recipes. Audio/haptics remain opt-in; autoplay mode selection is not audio permission. Optional wake lock uses existing truthful capability reporting and releases on pause/hide. No promise of playing while the browser is closed or the phone is locked.

Extend validated preferences with last pace, version migration and fallback to Medium for absent/invalid values; leave mute, family and quality intact. Private storage failures must remain playable. Running state and UI-hidden state remain session-only. Existing scene/transparent links and defaults continue parsing unchanged. Supporting `show=always&pace=1..4` for explicitly shared presentation links is a second-stage integration task: clamp inputs, preserve old links, and never let a saved preference auto-start an ordinary visit.

## 9. Implementation ownership map

| Files / responsibility | Planned change |
| --- | --- |
| `src/engine/AlwaysPlayDirector.ts` (new), `catalog.ts` | Typed pace configuration, bounded phrases/bag, deterministic director; add `always` without changing family indices or legacy recipes. |
| `src/engine/Simulation.ts` | Fixed-clock execution, admission diagnostics, pace setter, lifecycle/reset; preserve existing three show schedules and particle reservations. |
| `src/engine/useWorld.ts` | Play intent, manual takeover before admission, renderer feedback and QA replay; keep pause ownership. |
| `src/ui/ShowModeKnob.tsx`, `src/styles/stage.css`, `src/App.tsx` | Fifth dialog mode, radio pace control, Start/Stop, responsive focus, immersive availability, no new permanent HUD clutter. |
| `src/platform/preferences.ts`, `presentation.ts` | Validated pace migration, explicit-link integration, no persisted running state. |
| Existing renderer QA snapshots and tests | Scalar counters and resource sampling; no unnecessary graphics algorithm changes. |

QA diagnostics: chosen pace, current demand interval, phrase phase, admitted/denied/expired counts by reason and family, future head reservations, live occupancy maxima, pressure/adaptation state, active simulation duration and actual backend. Keep counters bounded; avoid continuous telemetry or storing user sessions.

## 10. Reviewable delivery stages

1. **Director foundation:** pure configuration/director tests, fixed-clock integration and seeded replay; prove indefinite duration and bounded state. Preserve legacy show golden sequences.
2. **Controls and lifecycle:** fifth mode, four pace options, Start/Stop, storage migration, busy manual takeover, pause ownership and immersion. Check narrow/portrait interaction before graphics tuning.
3. **Visual tuning and qualification:** mixed-cost bags, featured heavy effects, cost-aware overlap, adaptation and comfort. Record matched videos and performance at all paces; adjust proposal values based on evidence.
4. **Preview and release readiness:** full required regression CI, isolated Cloudflare preview, exact source/release fingerprint, public controls/backend/offline/recovery checks and retained rollback. Production promotion remains a separate release action after actual implementation and gates; this document does not deploy anything.

## 11. Acceptance and test matrix

### Engine and lifetime

- Assert monotonic admitted density over five-minute fixed-budget windows for four paces on qualified full-effects Standard/Ultra workloads. High and Super High should be at least 25% apart in the chosen qualified reference configuration; publish actual counts and limiting conditions.
- Ten-minute runs at each pace cover every family on unconstrained Standard/Ultra, including deferred feature slots. Test Low cost-3 solo escape, no adjacency repeats, heavy-family starvation and residue-heavy bags separately.
- Two-hour logical soaks for every pace × tier with several seeds and comfort combinations; assert capacities and future reservations, finite values, bounded buffers, no recursively spawned composites and no count-growing state. This is simulation endurance, not physical thermal evidence.
- Run pause/hidden for simulated long absences, pace switches in fuse/ascent/afterglow, reset, rejected manual taps, invalid inputs, recovery and quality changes while children are pending. No pending accents may burst on resume.
- Preserve legacy Calm/Festival/Finale RNG sequences; all thirteen existing manual identities remain unchanged. Verify adapter feedback replay separately from a no-feedback deterministic run.

### Browser and visual

- Native WebGPU, forced WebGL and Canvas independently; all seven existing viewports from 320×480 to 1920×1080. Use the repository matrix, not a new substitute. Include live resize/rotation while running.
- Keyboard/focus, touch targets, four legacy drag directions, fifth-mode discoverability, modal cancellation and user pause ownership. Test immersion at all four paces, reveal/Space/Escape, errors while hidden, reduced motion and reduced flashes.
- Private/corrupt storage, reload, explicit presentation links, transparent mode, missing assets, cold offline reload, service-worker updates and renderer recovery. Always Play remains available with playable asset fallback.
- Matched seed/time/backend/viewport videos include Low and Medium identity views, High overlap, Super High peak density, each heavy family, water reflections and manual takeover. Record at least 60 seconds per pace plus a ten-minute peak run. No reflection saturation rectangle, tail truncation, washed-out sky, repetitive center blob or busy-state stuck UI.
- Flash analysis includes default reduced-flash and full-effects peak sequences across all effects. Keep limits and unresolved findings explicit.

### Performance and release evidence

Compare warmed candidate with current `.11` on the same hardware/backend/tier using at least four counterbalanced repetitions. First run identical existing manual/Festival workloads: p95 rendered-frame regression must not exceed the greater of 2ms or 20%, with no new repeatable launch-transition hitch. Then measure the new four paces separately; their higher intended workload is not directly comparable to a single-launch baseline.

For each Always Play level report admitted rockets/minute, distinct visible overlaps, live/future occupancy, automatic throttling time, render and rAF p50/p95/p99, >50ms/>100ms frames, CPU submission, reveal/stop response and long-run memory trend. Proposed reference target: p95 rendered interval at or below 33.3ms for qualified Standard/Ultra desktop configurations and controls responding within 100ms in at least 95% of trials. If Super High misses targets, tune demand/selection before release; report limited tiers honestly. Measure completed GPU timing only where supported and actually collected.

Run required unit, lint/build, launch/platform, Grand Collection, interaction, viewability, recovery, water/immersion and burst-transition suites on PR and main. Native browser evidence must not be relabeled from software CI. Include all source SHAs, release fingerprints, seeds, timestamps, dimensions and failures alongside passes. Existing water-only performance qualification does not qualify dense continuous fireworks.

Physical-phone 30-minute sustained runs, thermal throttling, Safari and background/lock behavior remain NOT TESTED until observed on actual devices. Logical soak and desktop viewport emulation do not replace those checks.

## 12. Explicit scope

This phase adds one endless mode and four adjustable quantity levels. It preserves the thirteen effects, current waterfront, existing modes, quality controls, offline play and immersion. No new effects, music, audio autoplay, accounts, telemetry, backend, background service, automatic production deployment or particle-cap expansion is included. Initial numeric values above require qualification during implementation.
