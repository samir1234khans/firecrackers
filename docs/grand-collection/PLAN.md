# Grand collection — design and implementation plan

Date: 29 September 2026. Owner request: fetch latest, add five brilliantly designed and colored fireworks, make them grander, implement and checkpoint thoroughly.

## Authoritative baseline

Fetched `fix/viewability-recovery` at `f48a8bf4a153ce5077a8901738bb4883aebc456b`; development branch `feat/grand-collection` starts from it. The public app is `firecrackers-a93nle`. Preserve the repaired single-press launch, immutable active rocket, visible manual deck, compatibility renderer, startup recovery, offline support and host-toolbar-safe layouts. Do not restart from the older V3 branch. Original five identities and saved preferences remain valid. Main and other branches stay unchanged.

## Art direction

Grand means a larger readable composition, layered colors, different silhouettes, visible secondary travel and sustained falling detail. It does not mean a white screen, strobing, arbitrary camera shake, increased audio volume or unbounded particles. Retain stable perspective, ballistic motion, shared wind and smoke, local colored lighting and the approved dark/gold interface.

| New family | Palette | Signature silhouette and progression |
|---|---|---|
| Aurora Crown | Emerald, mint, turquoise and violet | A wide upper canopy arranged as a crown, with violet interior stars and long gently falling tips. |
| Ruby Dahlia | Ruby, rose, fuchsia and champagne | Twelve clustered petals expanding around a small champagne center; thick colored comet traces that warm at extinction. |
| Sapphire Saturn | Cobalt, sapphire, ice blue and pale gold | A spherical blue center inside a larger tilted champagne orbit, with real depth separation and short, clean star traces. |
| Phoenix Palm | Copper, amber, coral and rose | A fan of heavy rising palm branches; selected traveling parents split into smaller rose-gold leaves before falling. |
| Opal Supernova | Opal blue, jade, lavender, coral and gold | A broad initial star wreath sends out visible colored carriers; seven staggered, differently colored blossom clusters create a finite layered bouquet. |

These are original software effect designs, not physical pyrotechnic instructions or measured real-world specifications. No new paid assets, dependencies or backend are required. New artwork in the selector is native scalable iconography reflecting actual effect morphology. The particle scene remains real-time simulation, not an image or video backdrop. This is an extension of the approved design system, not a redesign.

## Architecture and resource contract

1. Append stable catalog IDs; never reorder original indices. Add named metadata and conservative reservations. Keep the global head, trail, smoke, ember and audio caps.
2. Implement a separate deterministic grand-effect recipe module. Every recipe emits bounded star descriptors. Layer membership must survive lower quality, not depend on truncating the final part of an array.
3. Extend secondary-carrier metadata for palette/variation and bounded child recipes. Never recursively spawn a full composite from a child. Required child counts are reserved at launch, including the extra Phoenix splits.
4. Give new stars family-specific color aging in the simulation so 3D heads, historical trails and Canvas fallback agree. Avoid per-frame random flashing. Preserve existing original-family semantics.
5. Make show selection catalog-driven and deliberate. Calm avoids dense composite fireworks; Festival and Finale can choose from the whole catalogue. Avoid immediate repetitions and account for the longer composite lifetime when spacing shows.
6. Add five authored icon silhouettes and ten safe 3D rocket proportions. Remove five-element array indexing assumptions; no undefined dimensions/NaNs for new families.
7. Keep two readable collections of five: Classics and Grand collection. Switching collections selects the last used style there, or its first style on first use. Preserve keyboard 1–5; add 6–9 and 0 for the new five. Existing startup selection is preserved, with Grand collection clearly discoverable.
8. Update help, compatibility messaging, source-fingerprint inventory and tests. Do not change safety, sound or permission defaults.

## Implementation checkpoints

- C0: fetch authoritative code, reproduce baseline, commit plan.
- C1: recipes, reservations, palette aging, splitting/carriers, show selection and engine tests.
- C2: collection controls, five icons, rocket variants, help and fallback integration.
- C3: production build, old/new tests, 3D and Canvas captures, responsive and recovery gates; repair actual findings.
- C4: existing preview update, published source/behavior verification, evidence and final checkpoint.

## Acceptance gates

All ten IDs must be reachable, named, persistable and launchable. The original one-press lifecycle, duplicate-click prevention, manual takeover, paused-state preservation, compatibility recovery and offline startup must remain functional. No layout overflow or blocked Launch action on desktop, portrait, short phones or landscape.

Each new family is tested at Low, Standard and Ultra; it must create finite 3D coordinates, maintain its defining layers, stay inside reservations and pool caps, complete naturally and clean up. Same seed/inputs remain reproducible. A Phoenix child starts at its parent position with inherited motion. Opal children burst at their actual carrier position, do not spawn another composite and remain at least 0.7 seconds apart. Reduced-flash defaults remain on; area/frequency review of final imagery is a separate qualification, not a certification inferred from a checkbox.

Capture the actual rendered new effects on both 3D/WebGL and Canvas. Check sky framing, color separation, shape distinction, readable labels, launch availability, pause/resume during child stages, and no new application console errors. Run the existing viewability and launch tests plus expansion-specific regression/long-run checks. A logical soak does not count as hardware thermal or real-time endurance evidence.

Browser plugin is not listed in this session. Local Playwright navigation is blocked by managed browser policy (`ERR_BLOCKED_BY_ADMINISTRATOR`); do not change or bypass it. Use the repository's authorized GitHub Actions browser runner and inspect its real captures. Local Node/TypeScript/build checks remain available.

## Preflight before publishing

Use the existing frontend-only React/Vite application ID. Read current hosted source for changed files and preserve wrappers/PWA/recovery. Send only changed files, unique verified diff anchors or complete new files. Reconcile tests/tests.json for the expanded user-visible flows. Pass build/type/lint and targeted browser gates, keep provenance and remaining qualification honest, and verify the deployed module fingerprint. Poll deployment through its terminal state and inspect reported errors. Do not promote main or change domains.

## Reference boundary

W3C flash guidance: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold . Evaluate the whole rendered output, not merely individual bursts; larger effects are not permission to introduce rapid full-screen flashing. Existing Three.js 0.180.0 and the current renderer APIs stay pinned. No external effect engine is being added.

## Delivery outcome

The implementation and public verification are complete for build `2026-09-29.1`. See the [final delivery record](../evidence/grand-collection-delivery.md) for exact source, live checks, corrected compact layout and remaining physical-device/art qualification. The planning gates above are preserved rather than replaced by an unsupported universal-completion claim.
