# Borderless controls and placed drag launch — preview evidence

Build `2026-09-29.5` is available at [the isolated Cloudflare preview](https://firecrackers-pad-preview.allygym-api.workers.dev/), Worker version `6f6ff7d8-dc55-458e-9011-40d5f8554856`. Its live `/release.json` reports SHA-256 `36bebaa351ce233d0c8bab75e57a4cdaa33a587ab977edda5854116c3796034d` across 50 delivered source and asset entries, matching the final local build. The preview has no production route. Production still serves build `.3` until the reviewed change is promoted.

## Interaction delivered

- Desktop and tablet firework icons, their quick Launch controls, the main Launch control, and the compact phone dock are transparent and borderless. The selected style's adjacent flame icon is visible at rest; other quick flame icons appear immediately on hover or keyboard focus. Hit areas stay at least 44 pixels on desktop and 48 pixels on compact layouts; the main Launch target stays 56 pixels.
- Dragging a style from either desktop side or the phone dock into the clear sky releases one immediate burst. Dropping it in the terrace-height band starts the normal fuse and flight at the projected horizontal position. Invalid and canceled drops leave selection and placement unchanged. The phone dock fades while a captured drag is active, leaving the terrace available as a target.
- The next pad rocket and its Launch action appear as soon as the committed flight bursts. There is no artificial 0.32-second rearm delay. An active fuse or flight still rejects duplicate admission; particle capacity still applies. Both WebGL and Canvas show the next pad rocket at the same readiness point.
- The central stage measurement reserves space for adjacent quick actions even when they are hidden. Hover and focus therefore do not change the camera corridor. Only currently visible actions block pointer drops.

## Verification completed

| Check | Result and scope |
| --- | --- |
| TypeScript, lint, production build | Passed; final 50-entry fingerprint above. |
| Unit and engine tests | 125 passed, including left/center/right pad launches, failed admission immutability, immediate next readiness, committed rocket protection and all ten sky-burst lifecycles. |
| Hosted preview stage browser | [34 checks passed](pad-launch-v5/preview-stage-report.json), zero page errors. Includes seven requested viewport sizes, borderless controls, clear hero corridor, instant selected quick Launch, desktop/mobile sky and pad drops, invalid drops, focus, audio and asset recovery. |
| Hosted preview Grand Collection browser | [42 checks passed](pad-launch-v5/preview-grand-report.json), zero page errors; desktop and emulated mobile WebGL/Canvas, all ten styles and complete cleanup. |
| Hosted preview original playback/platform browser | [28 checks passed](pad-launch-v5/preview-original-report.json), zero page errors; real input, duplicate rejection, immediate next rocket, pause, shows, settings, offline reload and protected output. |
| Hosted preview recovery/viewability browser | [15 checks passed](pad-launch-v5/preview-recovery-report.json), zero failures. |
| Accelerated logical soak | 7,200 simulated seconds, 1,317 launches and 2,875 bursts; bounded trails, smoke, heads and rockets. This does not measure GPU frame rate or heat. |

[Desktop resting layout](pad-launch-v5/preview-desktop-layout.png), [expanded phone dock](pad-launch-v5/preview-mobile-dock.png), [desktop Sapphire Saturn in WebGL](pad-launch-v5/preview-desktop-webgl-saturn.png), and [mobile Sapphire Saturn in WebGL](pad-launch-v5/preview-mobile-webgl-saturn.png) are captures from the hosted website. The stage report records a clear central width of 57.5% at 320×480, 65.4% at 393×851, and 77.5% at 1280×800. These are browser captures, separate from image-generation concepts and Blender source renders.

Chromium desktop and mobile emulation passed. Physical Android/iPhone touch, Safari, hardware WebGPU, and sustained real-time frame/thermal targets remain unverified. Production promotion, public production checks and rollback are recorded in a separate release receipt after they occur.
