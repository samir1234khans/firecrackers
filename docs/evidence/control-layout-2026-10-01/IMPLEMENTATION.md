# Open sky controls and responsive launch prop

Candidate implementation, 1 October 2026. Branch `feat/open-sky-controls` starts from the owner-selected thirteen-effect moon/water candidate `7946153` / application source `6af8dd6`. The separately retained flagship and moon previews, PRs #26/#25 and production `.8` are not overwritten. This delivery is an isolated preview candidate, not a production promotion.

## Visible behavior

- The visible wordmark and star are removed. An accessible application heading and document/PWA name remain.
- All thirteen glyphs appear in stable order on the left, without collection captions or enclosing cards. Artwork stays approximately 32px inside 48px targets. The measured safe height selects one, two or three columns; no scrolling/carousel is needed at the seven acceptance sizes.
- Pause, Sound and Controls sit in the lower-right corner. Controls opens the existing shared Settings, Fullscreen and Help surfaces. Panels scroll above the footer and retain native modal focus and pause ownership.
- A single mode knob opens four named directional choices: up Manual, right Calm, down Festival, left Finale. Directional dragging previews a mode and commits on release. Cancellation and Escape preserve the current mode. Changing modes retains an explicit manual pause, and selecting the current mode does not restart the sequence.
- The lower position track controls the next rocket, with keyboard endpoints/arrows and finer Shift/raised-drag adjustment. A small ground marker previews placement. Random selects a fresh admissible position at accepted normal launch. Explicit terrace drops override Random for that launch; sky drops retain the exact burst point.
- The launch support uses subdued steel/brass, low geometry and a cached contact shadow. The authored stone terrace, moon, boats, waterfront and water remain. Rocket bodies are proportionate to available screen height; their burst recipes retain their own scale.

## Shared contracts

`StageLayout` reserves a 76px footer plus the safe bottom inset and measures the actual left collection, utility rail, position control, mode control and transient popup. The collection does not reserve a full-height left gutter. Pointer releases reject these real footprints.

`LaunchComposition` resolves the standing silhouette, model scale, foot contact, shell/motor offsets, pad radius and usable terrace bounds. GPU and Canvas consume the same virtual geometry and normalized 0..1 placement semantics. Canvas approximates materials in 2D; it does not claim identical GPU lighting.

`LaunchProfile` freezes the model, origin, launch position, apex and inward aim at admission. The existing powered rise/coast solver remains. Edge launches use smooth lateral aiming while preserving the large upper-sky composition; the camera remains tied to the fixed waterfront. Resizing resolves future profiles without rewriting an admitted flight. Rocket model scaling is independent of burst effect scaling.

Simulation owns a separate seeded placement stream. Rejected admissions and explicit sky/terrace drops do not consume the next Random position. Reset restores this stream with the other seeded state. Saved fixed/random preference and position migrate with safe defaults; existing sound, quality, comfort and renderer preferences remain.

## Verification status

The initial unit pass identified one superseded assertion that disallowed next-position changes in flight. Its replacement asserts both the updated draft and the unchanged committed rocket. New tests identified and fixed placement RNG reset. The subsequent full run passed **206/206 units**. Browser, performance, source fingerprint and deployment receipts are recorded in PREVIEW.md when validation completes.

The earlier [plan](PLAN.md) and [schematic study](wireframe.html) are design history. They are not rendered application evidence. Actual before/after captures are tied to backend, viewport, seed and release fingerprint in the final preview receipt.
