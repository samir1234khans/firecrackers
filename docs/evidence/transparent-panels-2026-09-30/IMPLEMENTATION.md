# Transparent edge panels: implementation receipt

Recorded 30 September 2026 in the isolated `firecrackers-galactic` checkout, branch `feat/transparent-edge-panels`, extending main `1648786955a3af10e60f99807236d1676bad6284` / galactic-sky build `2026-09-30.5`. [The per-surface plan](PLAN.md) defines scope and release gates.

This receipt describes inspected source, exact color-token calculations and preserved failed attempts. The final compiled candidate has passed 195 panel checks, 167 existing regression checks, 56 installed-Chrome hardware checks and 17 preview HTTP checks. [Preview qualification](PREVIEW.md) records the exact source and methods. **CI, main promotion and production remain pending at this implementation checkpoint.** Software/browser emulation and mathematical contrast are separate from physical-device performance and production evidence.

## Source identity and ownership

- `src/engine/catalog.ts` declares candidate version `2026-09-30.6`.
- `scripts/generate-release.mjs` adds `src/styles/panels.css` and `index.html` to the delivered-module inventory, bringing the compiled inventory from 58 to 60 entries. This now fingerprints both the application panel foundation and the independent static startup shell. The final preview identity below matches both the final local panel report and reviewed public HTTP report. Git/Worker identity and terminal results are coordinator-reported; no earlier `.5` hash is assigned to this candidate.
- Foundation: `src/ui/Dialog.tsx`, new `src/styles/panels.css`, and removal of obsolete panel-only rules from `src/styles/stage.css`.
- Panel content/navigation: `src/App.tsx`, `src/ui/PanelNav.tsx`, `src/ui/FamilyPicker.tsx`, `src/ui/PresentationSettings.tsx` and `src/ui/AppBoundary.tsx`.
- Coordinator: static `index.html` recovery, version/generator, integration, tests, evidence and release. This documentation task changes only this receipt and byte-exact report copies in its `intermediate/` folder.

No graphics engine, live simulation, sky/river assets, playback HUD or resting mobile dock redesign is part of this implementation. The native controls retain existing actions and saved preference fields. The stylesheet loads after the earlier scene/HUD cascade; its primary selectors are scoped to opened dialogs and loading/recovery/presentation reveal controls. Obsolete `.sheet`, picker/position and dialog-drag rules were removed from `stage.css`; scene touch policy, shelves, dock and scene drop-target rules remain there.

| Final compiled preview | Recorded identity |
| --- | --- |
| Version / fingerprinted entries | `2026-09-30.6` / 60 |
| Delivered-module fingerprint | `1249e82e8ab6604c52d7c32002a939792e3a9724bcd4fb7fe34e5d0d183fafe0` |
| Source commit | `9073379e30dc6623cbe9cd2f3bc2415744bb5fe6` (coordinator-reported) |
| Review | PR #22, draft (coordinator-reported; CI/promotion pending) |
| Preview | [firecrackers-panels-preview](https://firecrackers-panels-preview.allygym-api.workers.dev/) |
| Worker version | `1bbbcebb-8126-4da0-a3fb-2ad98c939629` (coordinator-reported) |
| Terminal checks | Typecheck, lint, 144/144 unit tests and production build passed; audit zero vulnerabilities (coordinator-reported) |
| Final local panel qualification | 195 passed, zero failures, zero unexpected errors; browser closed, zero remaining contexts |
| Final public preview HTTP | 17 passed; reviewed report matches the final fingerprint |

### Preserved intermediate attempts and corrections

The [copy manifest](intermediate/REPORTS.json) lists original ignored report paths, copied filenames, exact byte sizes and SHA-256 hashes. The raw copies retain their original failures, errors and captured source identities; the final reports do not overwrite them. Screenshots remain in their original local `test-results/` folders and are not made durable by a JSON copy.

| Attempt / exact raw report | Source and observed result |
| --- | --- |
| First compiled preview | `286736758ffb75aaf64dba3f354abb340539d5ff210348236d8d43adbe2f0d1b`, 60 entries, Worker `9dbb0e05-5bb6-41fe-af48-618946597316`. Type/lint/144 units/build/audit-zero and 17 HTTP checks passed; later review found the fatal-recovery flex direction defect. |
| [First installed-Chrome qualification](intermediate/first-preview-hardware-report.json) | Coordinator associates this with `286736…`. 10 completed checks, then `Comfort idle must remain static` failed in the live reduced-motion case; errors array empty. A failed behavior assertion is retained separately from GPU errors. |
| Boot-column correction preview | `9f68f1c94c8c996e7abd2a27d72c3cbe6b7ceab3b01bec6afb30cbd69aae92d9`, 60 entries, Worker `4e434a8b-2798-419c-9b43-cbf7913d41c2`. Used by the first broad panel run and diagnostic probes. |
| [First broad local panel run](intermediate/first-local-panel-report.json) | 84 completed checks, 11 failure records and one logged `THREE.WebGPURenderer: WebGL Device Lost: Message: Unknown reason` error; 71 screenshot references. Browser closed with zero contexts. This is not a successful qualification. |
| [Text-origin drag probe](intermediate/text-origin-drag-probe-report.json) | The surviving report contains zero completed checks and one failure, not a later glyph-origin pass. A second gesture starts on the Gold Willow `SMALL` description, acquires pointer capture, then receives `pointercancel`/`lostpointercapture` at `(0,0)` without a launch. Errors array empty; browser closed, zero contexts. |
| [Reduced-motion diagnostic probe](intermediate/motion-probe-report.json) | 11 completed checks, no failure or errors, source `9f68f1…aae92d9`. The live media-preference check records `skyMotionAllowed=false` before/after and render frames `150 → 150` over the observation interval. This diagnostic does not qualify final source `1249…`. |
| [Final local panel run](intermediate/final-local-panel-report.json) | Final `1249…` source: 195 completed checks, zero failures/unexpected errors and 137 screenshot references. Browser closed with zero contexts. |
| [Final reviewed preview HTTP](intermediate/final-preview-http-report.json) | Final `1249…` source: 17 completed checks, zero errors; checked `2026-09-30T13:08:01.094Z`. |

**Application fixes:** read-only review found `.boot-shell` used `display:flex` without column direction after the inline startup change; the scoped `flex-direction:column` correction prevents heading/message/actions becoming horizontal siblings. The first broad UI run also demonstrated that native Tab cycling could leave the dialog for the document/body/browser chrome. An explicit Tab boundary now wraps visible enabled sequential stops while keeping native inert/Escape behavior. Full picker rows retain a 48 px floor on desktop as well as touch layouts. Picker `user-select:none` and `-webkit-user-select:none` prevent native text selection from hijacking a subsequent firework drag; permanent descriptions were removed from rows while original notes remain as native title tooltips. The surrounding HUD becomes quiet only while an explicit dialog is open. These source fixes were included before the final qualification.

**Fixture corrections:** the harness now reaches Help through the actual Settings → Device path when the duplicate short-window HUD shortcut is hidden; scrolls a native radio's complete label rather than its small internal input before hit testing; waits for the real delayed renderer and QA readiness before taking snapshots; and records actual second-drag pointer events and empty text selection at the ordinary row-center origin. The original 44/48 px targets, 60/78% height limits, safe-gutter bounds, focus containment, drag validity and playable recovery assertions remain. The final recovery fixture deliberately invokes `WEBGL_lose_context`; only its exact expected renderer diagnostic is classified as an injected fault, with all other errors still failing the run. The initial report's logged error and snapshot-readiness failure remain available above.

The first hardware reduced-motion failure is not assigned a proven cause. The later `9f68…` diagnostic establishes a static observation after a live browser media-preference change, implemented with `page.emulateMedia({ reducedMotion:'reduce' })`; it does not claim that a physical Windows accessibility setting was operated. Final-source hardware qualification is still pending. No rendering engine or motion-policy source change is attributed to this panel batch.

## Implemented surface inventory

| Surface | Inspected native composition and preserved capability |
| --- | --- |
| Picker | Compact title, Classics/Grand switch, five unboxed glyph/name rows per collection with original notes in native title tooltips, selected-state tint, short sky-versus-terrace instruction and accessible selected-center-burst action. All ten stable identities remain. Selection closes; picker drag keeps its established scene-coordinate release. |
| Position | `.2–.8` draft slider, small line/marker preview and percentage output, Left/Center/Right chosen presets, Set position and Help. Commit behavior remains explicit after closing the overlay. |
| Shows | Manual action, Calm/Festival/Finale native radio rows with concise descriptions, Start and optional Stop. Finale remains the existing finite 32-second sequence; manual selection keeps priority. |
| Settings shell | Graphics, Sound, Display and Device are real tabs, with exactly one visible pane. Graphics opens initially. Tabs occupy a fixed navigation slot outside the scroll body. |
| Graphics | Actual renderer line, quality select, Auto/WebGPU/WebGL/Canvas links and independent reduced-flash/interface-motion controls. Renderer links keep saved quality and open a fresh sky; Ultra remains the existing default. |
| Sound | Explicit activation, bounded volume with percentage, quiet ambience and haptics. Unsupported vibration is truthfully shown and disabled; sound does not autoplay. |
| Display | Interactive/scene/transparent output, pacing and 30/60 target selects, protected-area toggle and optional four-edge editor, Start/Copy, link fallback field, streaming disclosure and Return to interactive. Existing rectangle constraints and clipboard fallback remain. |
| Device | Wake-lock capability, offline status, installation/help, fullscreen, explicit update/restart guard, optional live build/graphics diagnostics, Help/replay/reset and privacy/storage disclosure. Hosting data collection is described separately from local preferences. |
| Help | Three concise Choose/Drop/Launch steps, comfort toggles, flash/audio/pause guidance, Enter/Skip actions and keyboard disclosure. Desktop rails and phone Styles dock are explained without long introductory prose. |
| Reset | Small explicit confirmation, Reset sky and preferences, and Keep my sky. Close, Escape and cancel return to Settings/Device and its Reset trigger; confirmation retains existing reset behavior. |
| Renderer loading | Compact status with icon, truthful automatic-switch explanation and reachable compatibility entry. The unused decorative animated loading dot is hidden. |
| Renderer recovery | Actual error text plus Retry current quality, WebGL, lower quality, Canvas, Reload and Settings; no opaque glass wrapper. Recovery remains independent of a working renderer. |
| React application boundary | Compact `Sky interrupted` heading, saved-preference message, Reload and compatibility actions, using the shared foundation once app styles are available. |
| Static startup/chunk failure | Independent inline HTML/CSS shell near the lower-left edge, short sans heading, readable message, Reload and compatibility links. It works before React or its styles finish loading. |
| Presentation reveal | Small Show controls, Pause/Resume and Sound icons, with translucent local material and existing presentation visibility behavior. Transparent canvas output is unchanged. |

## Shared material, typography and layout

`panels.css` supplies surface, text, muted text, accent, hover/selection, spacing, safe-inset and hit-target tokens. The surface is `rgba(7,15,25,.76)` with a small local shadow, no decorative border, no gradient slab and no backdrop blur. Native dialog backdrop tint is only `rgba(2,6,12,.12)`; contrast calculations below deliberately assume no benefit from it.

Dialog headings are 16 px semibold system text; body, explanatory text and choices are 14 px with wrapping. Existing serif/oversized card styles are overridden in the scoped foundation. Primary actions use subdued accent text/tint rather than solid gold backgrounds. Firework glyphs preserve their identifying colors and fit a 32 px visual area inside the native row target.

| Layout rule | Implemented source contract |
| --- | --- |
| Ordinary desktop | 340 px width, maximum 360 px, 12 px plus safe-inset edge gutter. Help/show/picker/position anchor left; Settings/reset anchor right. Vertically centered. |
| Desktop height | Maximum `min(78dvh, 100dvh - 24px - safe top/bottom)`. Only the body scrolls. |
| Phone/short landscape | At width ≤767 px **or** height ≤540 px: bottom anchored, 8 px plus safe insets, width ≤360 px and available safe width, maximum `min(60dvh, 100dvh - 16px - safe top/bottom)`. |
| Targets | 44 px desktop; 48 px at width ≤1023 px **or** coarse pointer, including wide touch tablets. Native switch inputs have full target boxes around small visible tracks; radio labels retain full row targets. Full picker rows keep a minimum 48 px height at every viewport, preserving the existing picker target gate. |
| Header/navigation | Header and close occupy a nonshrinking flex row; Settings navigation is a separate nonshrinking slot. `.sheet-content.panel-body` is the sole dialog scrolling container. |
| Text/zoom | Text wraps; controls retain target floors. Narrow/short effective viewports use the compact contract. The final software run covers equivalent 200% CSS viewport/DPR reflow, doubled rendered panel text and reachable hit targets; physical/browser-menu zoom remains a separate evidence boundary. |

Recovery/loading/AppBoundary reuse the local material and compact typography; their long content can scroll. The coordinator's pre-React startup shell independently uses `rgba(8,15,24,.78)`, an 18 px system heading, 14 px body, 48 px transparent actions, and viewport-minus-24-pixel maximum height. It does not depend on the app stylesheet. `src/bootstrap.ts` retains its existing 10-second explanatory timeout and import-failure messages; this change styles that recovery without changing its mechanism.

## Exact contrast calculation

This is a color-token calculation over a maximally white `(255,255,255)` scene pixel, not a rendered screenshot, GPU color-space measurement or general accessibility certification. The calculation composites CSS channel values in encoded sRGB, then converts the resulting channels to linear relative luminance for the contrast ratio. Text colors are fully opaque. Shadows and the native backdrop's dimming are ignored.

For each background channel, `B = .76 × (7,15,25) + .24 × (255,255,255)`, giving `(66.52,72.60,80.20)`. A selected row adds a `.10` layer of `(218,190,143)`; a hovered row adds a `.08` layer of `(204,220,241)`. Each row background replaces the other state rather than stacking both.

For a normalized channel `c`, the linear channel is `c/12.92` when `c ≤ .04045`, otherwise `((c+.055)/1.055)^2.4`. Relative luminance is `.2126R + .7152G + .0722B`. Contrast is `(lighter luminance + .05)/(darker luminance + .05)`.

| Background state over white | Body `#edf1f6` | Muted `#c1cbd8` | Accent `#efd0a0` |
| --- | --- | --- | --- |
| Plain `.76` surface | 8.070:1 | 5.580:1 | 6.189:1 |
| Selected tint | 6.683:1 | 4.621:1 | 5.126:1 |
| Hover tint | 6.712:1 | 4.641:1 | 5.148:1 |

The initially considered `.68` surface yields only 4.127:1 for muted text over white. `.75` improves the plain surface but yields 4.467:1 in a selected row and 4.483:1 in a hovered row. The strictest solved minimum opacity is approximately `.7521901`; `.76` is the smallest hundredth satisfying the 4.5:1 target in every calculated state. This preserves transparency while allowing an opened panel to remain readable over a paused bright burst.

The static startup shell has its own conservative white-background ratios: body `#bac5d2` 5.636:1, inherited heading `#e9ecf1` 8.325:1, and action `#f0d09a` 6.663:1 on its plain `.78` surface. These remain separate token calculations. The final local run records browser captures and geometry checks; a token estimate does not certify every rendered pixel or hardware backend.

## Dialog, tabs, focus and drag behavior

`Dialog.tsx` retains native `showModal()` inert background and adds an explicit Tab boundary to contain sequential keyboard focus when Chrome would otherwise hand focus to its document/browser chrome. It has `aria-labelledby`, optional `aria-describedby`, a visible autofocus close button, native cancel handling for Escape, outside-rectangle backdrop dismissal, native close on cleanup and focus restoration. The compatible prop API adds optional `navigation`, `description`, `returnFocus` and `initialFocusId`.

`App.tsx` records the original HUD invoker when opening a panel. Every dialog receives that stable `returnFocus`, so Settings → Help/Reset can restore the original control after transient panel buttons have unmounted. Reset cancel sets the Settings-return flag, leaves Device selected, and uses `initialFocusId='settings-reset-trigger'` after `showModal()` to focus that trigger inside the restored dialog. Normal Settings opening resets to Graphics. The final software suite exercises these focus paths, forward/reverse Tab wrapping, Escape, backdrop dismissal and independent pause ownership.

The Tab handler runs only for unmodified Tab/Shift+Tab and recomputes visible enabled nonnegative-tab-index controls on each navigation event. It excludes hidden/inert/aria-hidden nodes and honors a native radio group's checked-or-first sequential stop. First Shift+Tab wraps to last and last Tab wraps to first; an ineligible/outside active element is brought back into the dialog. Native focus during a wrap scrolls an offscreen action into the contained body, while dismissal still restores the HUD invoker with `preventScroll:true`. Other keys retain native behavior.

`PanelNav.tsx` uses `role='tablist'`, labelled `role='tab'` controls, matching `aria-controls`/`aria-labelledby`, `aria-selected` and one roving `tabIndex=0`. ArrowLeft/ArrowRight wrap; Home/End select and focus the endpoint. Inactive `role='tabpanel'` panes are native `hidden` and explicitly force-hidden by scoped CSS. The fixed navigation slot prevents the tab controls from disappearing when the content body scrolls.

Opening a panel retains the existing overlay pause reason and releases wake lock. Closing clears only that overlay reason through the existing world action. Position/show actions retain their explicit commit/start path. During a picker drag, `.is-dragging` hides panel material, header and unrelated body content, clears the backdrop and allows the scene-positioned drop target to remain visible; it does not add an invisible stage overlay. Picker rows disable native text selection, retaining their existing `touch-action:none` gesture contract. Explicit dialogs reduce edge-group/dock opacity to `.18`; active drag keeps the established dock-hidden rule and scene pixels are unchanged. Native pointer/launch policy remains with the existing App/engine path.

## Verification status and release boundary

The final [local panel report](intermediate/final-local-panel-report.json) uses bundled headless Chromium `140.0.7339.186` with software WebGL/Canvas. Every case requests `/release.json` and asserts version, exact delivered-source fingerprint and 60-entry inventory before executing its UI steps. This verifies real native dialogs and DOM input against one compiled candidate; viewport/touch, zoom-equivalent reflow, enlarged text and visibility/media-preference changes are explicitly controlled test conditions.

Coverage includes `320×480`, `375×667`, `393×851`, `768×1024`, `844×390`, `1280×800`, `1920×1080`, 200% reflow equivalent, doubled text, all opened panel surfaces/Settings tabs, scrollable actions, forward/reverse focus, close/Escape/backdrop/reset restoration, independent pause reasons, picker transparency and repeated drag/drop, position and transparent-presentation controls, held real entry/renderer chunks, blocked entry recovery, injected React-boundary recovery, actual software WebGL context loss and a playable Canvas fallback. The raw report separately lists expected injected faults; zero **unexpected** errors does not mean those intentional failures emitted no diagnostics.

| Check | Status at this receipt |
| --- | --- |
| Documentation/configuration structure | `python scripts/validate_docs.py`: 635 passed after this receipt and report preservation; this is a structural documentation gate, separate from application/browser checks. |
| Foundation CSS and Dialog TSX syntax | Previously parsed successfully with installed PostCSS/TypeScript. |
| Obsolete panel-selector removal from `stage.css` | Inspected: obsolete panel rules removed, resting stage/HUD rules preserved. |
| Worst-white material/row contrast | Mathematical target passed as recorded above; rendered hardware contrast is separate. |
| Final typecheck/lint/unit/build/audit | Coordinator reports pass; 144/144 units, zero audit vulnerabilities. |
| Final software panel qualification | 195 passed, zero failures and unexpected errors; 137 referenced captures; browser closed, zero contexts. Exact final source asserted for every case. |
| Isolated preview / reviewed HTTP parity | Published final preview Worker `1bbbcebb…`; 17 HTTP checks match `1249e8…fafe0`. |
| Initial installed-Chrome and motion diagnostics | Preserved separately: first hardware run failed after 10 checks; intermediate focused media-preference probe passed 11. Neither substitutes for final hardware. |
| Final installed-Chrome WebGPU/WebGL and captured appearance | 56 passed in installed Chrome 154.0.8037.59, headless with no software GPU flags. Intel nonfallback WebGPU and hardware ANGLE WebGL were asserted. [Raw report](preview/hardware-report.json). |
| Full Grand/original/stage/recovery/assets/lifecycle/overload/offline regressions | 167 passed against final `.6`/1249 source. [Aggregate](preview/regressions-report.json). Intentional fault diagnostics remain separate. |
| Draft PR #22 / main CI / promotion | Draft source checkpoint exists; CI and promotion pending coordinator release. |
| Production deployment and rollback receipt | Pending. This document does not declare `.6` production. |
| Physical Android/iPhone/Safari, thermal endurance, completed GPU-frame timing | NOT TESTED by this panel work. |

The foundation/content workers performed no builds, browser launches, Git mutations or deployments before the coordinator's testing gate. This documentation task preserves reports and updates the receipt only; it does not alter the application, weaken a test assertion or infer release completion.
