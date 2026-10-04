# Legacy realism production release - 4 October 2026

The owner explicitly authorized reconciliation and production deployment after the source-only handover. Build **2026-10-04.1** is now live at [Firecrackers](https://firecrackers.mainandmany.com/). This subsequent authorization supersedes the earlier deployment boundary.

## Source and artifact

Clean canonical main at deployment: `ba6e1669eecbc5e8d7526eca7cab0cf0bb601bbf`. All current local and remote branches are ancestors of main except the preserved historical alternate `feat/fireworks-v1-implementation`, which AGENTS explicitly excludes from current integration. No branch deletion, force push or historical blind merge occurred.

Deployed the exact downloaded successful main CI artifact from application merge `b185458078c5e8cb27e81439fc3472418c707280`, [runtime run 37166972363](https://github.com/samir1234khans/firecrackers/actions/runs/37166972363). The documentation/gallery successor has no application, asset, build or Worker configuration differences. [Main qualification](MAIN.md).

Fingerprint: `3d065114a3d2263b8119fac5c0ce95ffaf84d80a8bbaeeb9253edd54b9a7ca1c`, 150 module entries. All thirteen identities and reconciled water, immersion, Always Play, music, Studio and capture features are retained.

## Applied release

Authenticated pinned Wrangler 4.143.0 deployed the immutable artifact with `wrangler deploy --assets <main-ci-artifact>` from the clean canonical checkout, using the existing Worker and custom domain. No rebuild or full suite rerun was needed. The GitHub release-dispatch workflow was not run; no dispatch qualification is claimed.

- Worker: `firecrackers`
- Worker version: `e30d2169-d45f-4be4-bd9d-4f4efc468986`
- Deployment: `2760f593-6885-4bf0-bd76-9799558bc733`
- Applied: `2026-10-04T01:43:30.954375Z`, 100 percent
- Preserved previous version for rollback: `d849bfe4-9f8a-45a6-8003-215014b5a94a`, build `2026-10-03.4`

## Focused public verification

- [Public artifact parity](production-bytes.json): all 53 served files match exact CI SHA-256; public release version, fingerprint and 150 modules match.
- [Live backend smoke](production-smoke.json): native Chrome WebGPU, forced WebGL and Canvas on 393x851 and 1280x800; presented scene, finale, immersive controls, no horizontal overflow, explicit audio opt-in, bounded music and mute pass. No page errors. These checks do not measure GPU timing or physical-device performance.
- [Cache and offline](production-cache.json): actual production worker activation removes seeded obsolete app-owned `.4` caches, preserves unrelated storage, controls the current app and reloads `.1` offline. This is an isolated-context activation test, not a simulation of every previously installed worker.
- Public `release.json` returns `Cache-Control: no-store`. Existing hashed assets and deliberate Update & restart behavior are preserved. No whole-zone purge or unrelated cache deletion occurred. Existing open sessions may require Update & restart to activate the new worker safely.
- Visible native Chrome production inspection launched Sapphire Saturn and showed the new burst above the integrated waterfront. Runtime adapted this interactive window to Low after rendering pressure; no hardware performance qualification is claimed.

[Saved public WebGPU capture](production-webgpu.png) uses the isolated smoke context with service workers intentionally blocked, so its storage-unavailable notice is expected; the separate worker-enabled offline check passes.

Previous complete CI qualification is reused. Physical phone, Safari, thermal and clean sustained timing remain unqualified. No broad repetitive tests or extended performance benchmark were run for this deployment.
