# Frictionless firework shelves — preview evidence

Build `2026-09-29.4` is available at [the isolated Cloudflare preview](https://firecrackers-shelves-preview.allygym-api.workers.dev/). The preview Worker version is `80824c6a-2902-415b-aa61-99030e270beb`. Its live `/release.json` returned SHA-256 `07d1787a9f2dcf1edd61a7417208850d93df8b3d42b3449b869ac45ac8a5c099` across 50 delivered modules and assets, matching the final local build. This preview has no production route. At the time of this record, `firecrackers.mainandmany.com` still served build `.3` with fingerprint `4ae7b48094bad269c0a47655d5d20e6839b71f593100aa052d90e4df63a6a40d`.

## Interaction delivered

- Desktop and ordinary tablet screens show all five Classics in a narrow left rail and all five Grand styles in a narrow right rail. Each icon selects on click and can be dragged into the sky for one immediate burst. Hovering or keyboard focusing an icon reveals a nearby Launch action for that exact style, using the normal fuse and flight.
- Portrait phones and short landscape screens use a collapsed bottom-center Styles control. Opening it reveals ten 48-pixel touch targets. Dragging from it bursts at a valid release point and closes the dock. Invalid drops and canceled gestures do not launch. The short-landscape tray uses two shallow side-by-side collections.
- The detailed picker, main Launch control, keyboard shortcuts, pause ownership, selected-next behavior, offline package, and all ten effects remain. Admission is checked for the requested style, so a smaller effect can be used even if the current selected effect exceeds the remaining capacity. The active rocket stays immutable.
- The dock is outside the modal pause flow. The stage measures its expanded bounds and limits the drop canopy above it; the resting central corridor remains clear.

## Verification completed

| Check | Result and scope |
| --- | --- |
| TypeScript, lint, production build | Passed; local build produced the 50-entry fingerprint above. |
| Unit/engine tests | 119 passed, including explicit per-style launch, duplicate rejection, show takeover, target-specific capacity, and all ten drag burst lifecycles. |
| Hosted preview stage browser | [30 checks passed](frictionless-shelves/preview-stage-report.json), zero page errors. Seven resting viewports, side drag, mobile drag/cancel, hover/focus Launch, short landscape, touch targets, overlays, audio, reflection budgets, and missing-asset recovery. |
| Local Grand Collection browser | [42 checks passed](frictionless-shelves/local-grand-report.json), zero page errors; WebGL and Canvas on desktop and emulated mobile. |
| Local original launch/platform browser | [28 checks passed](frictionless-shelves/local-original-flow-report.json), zero page errors; includes offline cold reload. |
| Local recovery/viewability browser | [15 checks passed](frictionless-shelves/local-recovery-report.json), zero failures. |
| Accelerated logical soak | 7,200 simulated seconds; 1,317 launches, 2,875 bursts, bounded trails/smoke/heads. This is not real-time GPU or thermal evidence. |
| Documentation validation | 375 structural checks passed. Ignored generated `test-results/` output is excluded from documentation link checks. |

The hosted [desktop resting view](frictionless-shelves/preview-desktop-1280x800.png), [phone dock](frictionless-shelves/preview-phone-dock-393x851.png), [short landscape dock](frictionless-shelves/preview-landscape-dock-844x390.png), and [Ultra Sapphire Saturn WebGL capture](frictionless-shelves/preview-saturn-ultra-1280x800.png) are actual browser captures, separate from earlier image-generation concepts and Blender renders. The stage report records a clear central width of 57% at 320×480, 65% at 393×851, and 78% at 1280×800 with controls at rest.

The browser checks use desktop Chromium and mobile emulation. Physical Android/iPhone touch behavior, Safari, hardware WebGPU, and sustained real-time frame/thermal targets remain unverified. Production promotion and its separate public checks are recorded after they occur.
