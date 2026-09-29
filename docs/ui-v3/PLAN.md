# Firecrackers UI V3 — Cinematic Command Deck

Date: 16 September 2026
Status: active implementation direction

## Goal

Make the existing realistic 3D fireworks experience feel visibly more premium, spatial and futuristic without turning it into a game HUD or replacing the believable night-sky world.

The UI must feel like a crafted control surface floating over the scene: dark glass, warm-metal edge light, deep layered depth, very little persistent copy, and stronger physical/tactile emphasis on selection and ignition.

## Design target

The generated concept in the active design session established the visual language: deep navy/black glass, metallic-gold luminous edges, a clear top command rail, large family selectors, a selected-firework information surface, and a prominent circular ignition action. The concept's city/waterfront environment is **not** part of the implementation; the current festival-night renderer remains authoritative.

### Preserve

- single-screen app
- night sky as the primary visual surface
- five existing firework families and their exact names
- current 3D renderer, launch placement, hold/cancel semantics and single-action alternative
- sound-off startup, reduced flash/motion controls, keyboard access, PWA/offline behavior
- idle-hide behavior during viewing
- existing settings/show dialogs and display/stream functionality

### Replace or substantially redesign

- current top utility bar → split command header with brand, show mode rail and compact utility controls
- current small selection dock → larger cinematic family deck with clearer selected state and richer hierarchy
- current small fuse control → visually dominant radial ignition control while preserving the same accessible input behavior
- generic empty areas → subtle spatial UI anchors and a selected-family inspector on desktop
- flat glass treatment → layered glass/metal material system with restrained warm edge light and depth

## Screen architecture

### 1. Command header

Left: Firecrackers wordmark and a restrained one-line descriptor.
Center: mode rail — Manual, Auto Show, Festival, Finale. These map to existing manual/show behavior; they do not introduce new simulation modes.
Right: sound, pause/resume, fullscreen and settings as compact 44px+ controls.

The header remains visually quiet and should never compete with a burst.

### 2. Selected-firework inspector

Desktop/tablet only. A slim floating panel on the right shows:

- selected family name
- two short mood descriptors
- one-sentence effect character
- four short visual attributes represented as bars (intensity, height, duration, spread)
- a clear selected state, not a second competing launch button

It fades with other chrome in Watch state.

### 3. Family deck

Bottom-centered, approximately 5 equal family choices. Each item uses the existing family artwork/icon, name and one short mood line. The selected item gets a warm luminous edge and slightly greater depth/scale rather than a heavy filled card.

Mobile becomes a horizontally compact five-choice deck; no text-heavy inspector.

### 4. Ignition control

A circular/radial control becomes the visual center of the deck. It preserves:

- pointer hold to light
- release-to-cancel before commit
- Enter single-action alternative
- Space hold alternative
- current engine hold progress

The ring fills during hold. The center reads `Hold to ignite` in the normal ready state and `Release to cancel` during contact. `Light once` remains available as a secondary accessibility action.

### 5. Placement

Placement controls become a compact recessed rail instead of the visual focus. Dragging the scene remains available. Left/center/right and slider remain accessible.

## Design system

### Color

- canvas black-blue: #020409
- glass base: rgba(8, 13, 22, .72)
- deeper panel: rgba(6, 10, 17, .84)
- warm metal: #e4b56d
- hot gold: #ffc978
- primary text: #f5f3ee
- secondary text: #a9b2c2
- cool edge: rgba(177, 198, 226, .16)

Gold is an accent, not a page wash. Firework colors remain authored by the renderer.

### Geometry

- header/rail radius: 18–22px
- family item radius: 18–22px
- inspector radius: 24px
- ignition control: true circle, 108–132px desktop / 86–100px mobile
- 44px minimum interactive targets

### Material

Three layers only:

1. canvas/world
2. dark glass surface with subtle background blur
3. very restrained warm inner edge and specular highlight

Avoid nested bright glass boxes, neon cyan, wide bloom around UI, animated gradient backgrounds, fake scanlines and sci-fi filler text.

## Interaction states

### Choose

Header + family deck + inspector visible. Selected family is obvious. Placement is available.

### Contact

Ignition control fills; selected family deck quiets slightly; flame/fuse in the 3D scene carries the physical feedback.

### Watch

After idle timeout, header/deck/inspector fade. Pause/mute/reveal remain reachable. No persistent selected-family panel during the actual viewing moment.

### Automatic show

Mode rail indicates active show. Manual family selection keeps its current behavior of taking priority and stopping future automatic launches.

## Responsive rules

Desktop ≥ 1000px:
- full header split across width
- right inspector visible
- family deck + central ignition control

Tablet 700–999px:
- inspector reduced to compact selected-family summary
- mode rail may move under brand/utility row

Phone < 700px:
- no side inspector
- command header becomes brand + compact utilities
- mode rail is a compact segmented row
- family deck uses smaller labels but still exposes all five choices
- ignition ring remains thumb-reachable and does not cover the 3D fuse cue

Short landscape:
- compress vertical labels
- keep only essential text
- no inspector
- deck height ≤ ~92px plus safe-area

## Implementation checkpoints

### UI3-A — structure
- introduce `CinematicHUD` component
- move core scene chrome out of `App.tsx`
- implement command header, mode rail, inspector, family deck and radial ignition control
- preserve existing handlers and semantics

### UI3-B — visual system
- add dedicated `hud-v3.css`
- implement glass/metal tokens, selected depth, motion and responsive rules
- ensure scene remains visually dominant

### UI3-C — behavior and accessibility
- verify keyboard, hold cancel, first-tap reveal, manual pause persistence and mode selection
- preserve 44px targets and focus rings
- ensure reduced-motion removes decorative transforms

### UI3-D — verification
- typecheck/lint/build
- browser/Playwright desktop + mobile screenshots
- compare against the design target for hierarchy, density, palette, material, deck anatomy and responsive collapse
- store evidence in GitHub Actions artifacts

## Acceptance bar

The pass is successful only when the first screenshot is visibly and immediately different from V2: stronger composition, larger intentional controls, more depth, clearer family selection, richer selected state and a focal ignition interaction — without covering the sky or feeling like a generic game HUD.
