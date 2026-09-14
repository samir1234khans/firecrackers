# 12 — Performance budgets and compatibility

All numbers below are **proposed starting budgets and acceptance targets**, not benchmarks. Validate on physical devices and record exact hardware, operating system, browser version, viewport, selected backend, quality, and power conditions. Do not infer performance solely from device names or advertised GPU features.

## Initial quality budgets

| Budget | Low | Standard | Ultra |
|---|---:|---:|---:|
| Presentation FPS target | 30 | 60 | 60 |
| Primary emitter slots | 512 | 1,536 | 3,072 |
| Trail segment slots | 4,096 | 16,384 | 32,768 |
| Secondary spark slots | 1,024 | 4,096 | 8,192 |
| Smoke impostors | 48 | 96 | 160 |
| Transient light envelopes | 2 | 4 | 6 |
| Concurrent launch-cost units | 3 | 6 | 9 |
| Audio voices | 10 | 16 | 24 |
| Maximum device-pixel ratio | 1.0 | 1.5 | 2.0 |
| Maximum rendered pixels | 1.5 million | 2.4 million | 4.0 million |
| Estimated managed graphics memory ceiling | 96 MiB | 160 MiB | 256 MiB |

The per-category maxima cannot be interpreted independently of total memory/overdraw. Global caps override requested catalog counts. Every regular family costs one launch unit; Grand Finale costs three and reserves child capacity. Smoke persists in a separate bounded pool. Existing admitted effects retain a valid reservation while the next tier drains in.

The actual render scale is constrained by both DPR and pixel count. A high-resolution tablet must not automatically allocate a full native-resolution HDR pipeline. Bloom begins at half resolution, with quarter-resolution fallback. If a target cannot be sustained, reduce optional detail rather than falsely labeling the tier '60 FPS'.

## Performance acceptance targets

On an agreed Standard reference device, during a fixed-seed 10-minute Festival run after warm-up: median presented frame interval near 16.7 ms, p95 at most 20 ms, and no recurring greater-than-100-ms input-blocking stalls. Low tier aims for p95 at most 40 ms at a 30 FPS presentation target. Record actual distributions, not only average FPS. Browser scheduling and display refresh affect interpretation; state the measurement method.

Proposed interaction targets: visible selection feedback under 100 ms, no repeated long main-thread tasks during a normal fuse/launch, and simulation plus application updates generally within 4 ms per frame on the Standard reference. Rendering budgets are measured separately; GPU timing is used only where supported. No cross-platform GPU memory or thermal sensor API is assumed.

Initial loading targets: core compressed JS/CSS no more than about 700 KiB; critical first-interaction transfer no more than 3 MiB; complete offline package no more than 12 MiB before optional high-quality media. Aim for ready-to-place within five seconds on a documented cold-cache 10 Mbps / 100 ms network profile. These are targets to profile, not reasons to falsify asset quality or load measurements.

## Adaptation algorithm

Start conservatively at Standard settings only after successful capability initialization; unknown/weak environments may start Low. Observe a rolling frame-time window rather than user-agent strings alone. Proposed downgrade trigger: p95 exceeds the tier budget for three consecutive two-second windows. Upgrade requires at least 20 seconds of sustained headroom and no recent recovery; wait at least 30 seconds between tier changes to prevent oscillation.

Reduce in this order: excessive pixel resolution; expensive smoke layers and bloom resolution; decorative trail fragments; future automatic overlap; primary density only within family minima. Preserve the chosen effect's identity and manual input latency. Change topology at the next admission, not halfway through a burning fuse. Quality chosen manually acts as a requested ceiling, not permission to exceed hard safety/resource limits; expose the actual effective tier in Settings.

Long-session performance decay can suggest thermal throttling but must not be called a temperature measurement. Do not rely on a universally available battery API. Offer a quiet 30 FPS display setting and keep-awake status without claiming to prevent heat or battery drain.

## Compatibility contract

Core targets are current stable Chromium browsers on Android and desktop, Safari on iOS/macOS, and Firefox on desktop, tested at release with exact versions. The engine requires a validated WebGPU or WebGL 2 path. Browser brand is not proof of GPU support; drivers, policy, context creation, extensions, and device limits can change availability. The unsupported-graphics outcome is a useful static scene with controls and explanation, not a fake working 3D demo.

Audio activation, vibration, fullscreen, installation UI, and wake lock have separate capability checks. Never make a single 'supported browser' boolean control all of them. References: [S01, S06–S10, S13–S14](19-research-and-reuse.md). Recheck at implementation/release rather than treating this baseline as a permanent compatibility chart.

## Physical test classes

At minimum: a midrange Android phone, a modern Android tablet, an iPhone/iPad with Safari, a Windows laptop with integrated graphics, a desktop with a discrete GPU, and a Mac/Safari environment if available. Use Chromium/Firefox/WebKit automation for repeatable workflows, but do not label Playwright WebKit or a mobile viewport as real Safari/iPhone GPU validation.

Unreachable physical targets are recorded **unrun**, with a clear release support limitation or a pending gate. Automated emulation is useful evidence but not an excuse to promise smoothness on untested hardware.

## Soak and lifecycle evidence

Run 30 minutes on at least one physical mobile device and two hours on a visible desktop/tablet display. Sample allocations, live pool counts, audio nodes, event queue length, frame-time percentiles, and error count each minute. Managed counts must plateau; estimated graphics allocations must return after resize/recovery. Where heap measurements are available, distinguish normal garbage collection from persistent growth.

Test repeated orientation changes, settings open/close, mute/unmute, pause/resume, auto takeover, offline return, fullscreen denial, wake-lock revocation, and context loss. Browser backgrounding must reduce work, not continue dispatching every scheduled burst.

## Debug output

A development-only panel may show seed, build ID, backend, effective quality, draw calls, estimated allocations, active reservations, and frame-time percentiles. It is off in public display mode and never transmits hardware details remotely by default. Capture data in release evidence rather than presenting speculative performance badges.
