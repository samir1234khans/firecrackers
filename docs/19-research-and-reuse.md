# 19 — Research, evidence, and code reuse

Research checked on 15 September 2026. Links are primary documentation, standards guidance, project sources, or industry vocabulary sources. Live documentation can change: recheck the exact APIs and licensed versions at implementation. This was a documentation/feasibility review, not a benchmark, full source-code audit, device test, or comprehensive evaluation of every fireworks engine.

## What the evidence changes

The proposed Three renderer has a documented WebGL 2 backend, but advanced shader/compute features require deliberate parity testing. Browser-managed audio, installation, fullscreen, vibration, wake lock, and storage cannot be assumed from the browser name. Firework vocabulary distinguishes structural families, helping prevent five superficial recolors. Accessibility requires a real flash-risk review, not merely a reduced-motion switch.

The remaining numerical choices in this repository—particle counts, normalized heights, timing envelopes, budget caps, UI tokens, and performance gates—are project proposals. Sources below do not prove those values are optimal or that the app achieves them.

## Source register

| ID | Primary source | Relevance |
|---|---|---|
| S01 | [Three.js WebGPURenderer](https://threejs.org/docs/pages/WebGPURenderer.html) | Backend fallback, options, forced WebGL testing. |
| S02 | [Three.js TSL specification](https://threejs.org/docs/TSL.html) | Common node/shader model and backend compilation. |
| S03 | [Three.js maintainer discussion: TSL/WebGL2/WebGPU](https://discourse.threejs.org/t/tsl-and-webgl2-vs-webgpu/87974) | Advanced compute feature limitations; do not assume parity. |
| S04 | [American Pyrotechnics Association display glossary](https://www.americanpyro.com/display-fireworks-glossary) | Visual family terminology only, not construction guidance. |
| S05 | [Phantom Fireworks glossary](https://fireworks.com/education-and-safety/glossary) | Willow and other effect descriptions used for visual differentiation. |
| S06 | [MDN Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) | Timing-pattern interface and limited availability. |
| S07 | [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) | Visibility lifecycle and background throttling. |
| S08 | [MDN Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) | Visible-page request, denial, release, and reacquisition. |
| S09 | [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) | Media/audio activation constraints. |
| S10 | [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) | Audio activation, controls, and implementation considerations. |
| S11 | [W3C understanding SC 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) | Flash-risk criteria and assessment context. |
| S12 | [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) | Unified pointer handling and capture/cancellation. |
| S13 | [MDN making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) | Manifest/install behavior and platform variation. |
| S14 | [MDN Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) | Actual granted state and request failure handling. |
| S15 | [Vite getting started](https://vite.dev/guide/) | Build tooling and current runtime compatibility requirements. |
| S16 | [Vite PWA guide](https://vite-pwa-org.netlify.app/guide/) | Candidate service-worker/PWA integration. |
| S17 | [Playwright installation/guide](https://playwright.dev/docs/intro) | Browser workflow testing foundation. |
| S18 | [Vitest guide](https://vitest.dev/guide/) | TypeScript-friendly unit/integration test foundation. |
| S19 | [Cloudflare Pages Vite guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/) | Static deployment pattern; legacy page title is not a version pin. |
| S20 | [Three.js license](https://threejs.org/license/) | Published MIT terms; retain the adopted version's notice. |
| S21 | [fireworks-js project](https://github.com/crashmax-dev/fireworks-js) | Lightweight canvas fireworks API and published MIT license; reference candidate only. |
| S22 | [Lucide project](https://github.com/lucide-icons/lucide) | Small selected SVG icon set; published ISC license. |
| S23 | [Motion package license](https://github.com/motiondivision/motion/blob/main/packages/motion/LICENSE.md) | Optional interface animation dependency, published MIT terms. |
| S24 | [MDN storage quotas/eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) | Offline cache limits and failure handling. |
| S25 | [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/) | Static response header configuration. |
| S26 | [MDN CSP guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP) | Restrictive tested content-security policy. |
| S27 | [React synchronizing with effects](https://react.dev/learn/synchronizing-with-effects) | External engine lifecycle synchronization and cleanup. |
| S28 | [W3C understanding dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) | Alternatives to precision dragging. |
| S29 | [W3C understanding pause/stop/hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | Discoverable motion controls. |
| S30 | [Cloudflare Pages rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/) | Hosting rollback procedure; separate from worker cache recovery. |

## Reuse versus custom work

| Candidate | Proposed use | Do not assume / decision |
|---|---|---|
| React | Accessible UI, controls and integration lifecycle | Do not create a React component/state update per particle. |
| Three.js + TSL | Renderer, instancing, scene primitives, material/post-processing infrastructure | Validate the adopted feature subset on both backends; media in examples needs its own rights check. |
| Vite | Static TypeScript bundling and local development | Pin compatible versions; no need for server rendering in V1. |
| Vite PWA / Workbox integration | Manifest/worker generation and caching infrastructure | Prompt-style updates and app-specific asset verification still need design/tests. |
| Native Web Audio | Mix graph, activation, scheduled source playback | Build event dedupe, voice policy, and lifecycle cancellation ourselves. |
| Lucide | A handful of consistent named interface icons | Tree-shake/import selected icons; not a substitute for original rocket props. |
| CSS transitions; Motion optional | Restrained dock/overlay motion | Keep simple transitions dependency-light; never use it as the simulation clock. |
| Vitest / Playwright | Pure logic and browser workflow evidence | Automated WebKit/viewport emulation is not physical iPhone graphics evidence. |
| fireworks-js | Study simple lifecycle/launch API, potentially a clearly separate lightweight experiment | Reviewed public README/API/license, not a full engine audit. Its available controls do not establish our 3D smoke, tactile ignition, or five-family quality bar. Do not substitute it for the agreed hero without review. |

## What must be project-specific

The coherent manual ignition pipeline; five-family generators and topology; historical trails; smoke/light aesthetic; resource admission; event-based audio timing; director/manual arbitration; safe intensity envelope; quality-preserving fallback; and owner-reviewed art direction. Reusing infrastructure is desirable, but copying an attractive example is not a complete product.

## Adoption checklist

For any package or copied fragment, record package/file identity, exact version/commit, official documentation, license/notice, transitive dependencies, expected bundle impact, supported backends, modification scope, and replacement/removal path. Run a small integration proof before making it foundational. Do not select an abandoned/forked example solely by a screenshot or GitHub star count.

## Unverified items that require real evidence

No selected stable dependency versions are installed yet. No prototype has been rendered. No reference videos have been frame-analyzed or licensed for redistribution. No benchmark validates the proposed budgets. No device/browser matrix has run. No production media pack has been acquired. No flash-safety conformance or full legal review is claimed. These are explicit implementation/release gates, not hidden omissions.
