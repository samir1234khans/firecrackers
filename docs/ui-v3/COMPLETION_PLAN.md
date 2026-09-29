# UI3-E — complete the cinematic interface and launch stage

Date: 17 September 2026. Baseline: `35c61cb91c55b0206d7bdddc37c1416e9bcfc82a` on `feat/fireworks-v1`.

## Scope and visible result

Finish the approved Cinematic Command Deck instead of starting another redesign. Retain the existing React/Three.js TSL architecture, five families, fixed camera during playback, Ultra default, sound-off startup, reduced-flash default, offline capability and deliberate ignition.

The earlier generated concept supplies the black-blue glass, warm edge light, radial ignition, family previews and a tangible launch stage. Its waterfront photograph, sidebar destinations, gallery, favorites, VR label and unimplemented modes are not app requirements and will not be copied as inert controls. Render the stage as actual 3D geometry: a baked picture would not respond correctly to selection or illumination. This is an intentional implementation distinction from concept imagery.

## Baseline findings

The latest previous UI checkpoint did not pass its browser gate. Its evidence still shows the introduction open when later tests expect scene controls. Earlier changes that dispatch click events are not proof of pointer usability. Correct startup synchronization and exercise real clicks. Preserve the mobile Light once accessible-name repair.

The inspector's numeric-looking bars are authored decoration, not measurements. Replace them with useful qualitative effect characteristics. A repeated React snapshot must not replace the underlying dialog or erase focus. Reduced-motion CSS must not remove the deck's structural centering transform. Modal state, disabled actions, hidden controls and first-tap reveal need explicit tests.

## Checkpoints

### E1 — reliable interaction and truthful state

- Expose readiness and modal state for diagnostics without adding visible pseudo-technical labels.
- Synchronize tests to actual initialization and visible modal state; use normal pointer/keyboard actions, not programmatically dispatched clicks.
- Keep mode controls disabled until initialization completes or while a modal owns the interaction.
- Keep Light once visible and named on mobile; targets at least 44 CSS pixels.
- Prevent hidden controls from receiving an accidental ignition click. Keep focused controls visible and preserve layout under reduced motion.
- Show useful ignition states: ready/contact/fuse/rising/paused, not a permanently repeated hold instruction.

### E2 — cohesive panels and responsive deck

- Reuse the same dark-glass/warm-metal tokens for introduction, automatic show, settings, reset and recovery.
- Give settings a sticky title and real section navigation (Sound, Graphics, Display, Device) within one accessible dialog, not extra pages.
- Preserve current labels and functional settings; improve spacing, contrast and touch targets.
- Add family preview art to the inspector; use qualitative labels rather than invented numerical readings.
- Check 1536x1024, 1280x800, 393x851, 375x667 and 851x393 compositions.

### E3 — visible spatial launch staging

- Replace the almost invisible support with a layered obsidian/brass 3D launch platform, restrained illuminated rings, a contact pool and dark ground.
- Keep the platform grounded beneath the actual prepared object; move it with placement and freeze it on pause.
- Make foreground material and object scale legible without increasing aerial particle counts or changing airborne physics.
- Use selection/contact/thrust light to connect controls and world. No perpetual rotating HUD, camera shake or stronger flashing default.
- Hide foreground staging in transparent output; dispose all resources on recovery.
- Keep procedural assets labeled as procedural. This does not claim Blender smoke bakes, authored GLB assets or recorded sound.

### E4 — evidence and deployment

- Run exact-lock typecheck, lint, engine tests, build and documentation validation locally.
- Run actual Playwright browser tests and captures on GitHub Actions. Browser plugin is not present; local Chromium is managed with all URLs blocked, so use the authorized CI runner without modifying local policies.
- Verify all-family rendering, hold cancellation and commitment, real onboarding clicks, pause/settings, show takeover, responsive layout, reduced-motion centering, offline cold start and transparent output.
- Inspect actual screenshots against concept and prior runtime: hierarchy, typography, black/gold palette, preview treatment, stage depth, panel consistency and mobile proportions.
- Update the existing preview only after the relevant checks pass. Preserve main, alternate branch and rollback version.
- Update README, PROJECT_STATUS and evidence with exact source revision, completed results and genuinely unrun gates.

## Deployment checklist

Frontend-only React/Vite; existing app `firecrackers-a93nle`. No account/backend/API key or new dependency. Send only changed snapshot files and reconcile existing tests/tests.json with changed user workflows. Use existing hosting/PWA configuration. No concept image is shipped as a background or fake interactive surface; no attachment uploads are required. Review ready/error/QA status to completion.

## Release boundary

Passing this checkpoint means a usable, verified cinematic UI and actual launch staging. It does not establish photorealism, hardware WebGPU parity, physical phone performance, Safari/OBS behavior, two-hour GPU endurance or flash-safety certification. Those remain separately evidenced gates in the realism plan.

## Primary implementation references

- https://playwright.dev/docs/actionability — real clicks validate visibility, stability and event reception.
- https://playwright.dev/docs/locators — role-based locators and explicit state assertions.
- https://threejs.org/docs/pages/RoomEnvironment.html — environment lighting reference; only adopt pinned-release-compatible modules if needed.
