# 18 — Deployment and operations

## Proposed hosting strategy

The app is a static client build. Cloudflare Pages is a proposed long-term production target; an existing authorized Vercel setup could provide previews if needed. No hosting project, domain, database, or production deployment has been created by this documentation task. Do not infer account settings or plan limits from the architecture.

The official Cloudflare Vite guide documents the static build pattern: [S19](19-research-and-reuse.md). Its legacy page title is not a requirement to use Vite 3; implementation should select a currently supported compatible toolchain. Expected production artifact is Vite's static `dist/`, after the actual package scripts are established.

## Before a first deployment

Confirm the exact repository/branch and the intended hosting account/project. Inspect existing configuration so a new deployment does not overwrite another project. Ensure a clean reproducible build, committed lockfile/toolchain version, approved public assets, and a passing release candidate. No public API key or secret is necessary for V1.

The future build run should install from lockfile, run validations/tests, and run the defined build command. Example command names (`npm ci`, `npm run build`) are a convention to implement, not currently runnable commands in a documentation-only repository. Do not deploy the docs folder as though it were the application.

## Preview and production separation

Use branch previews for review. Production tracks a known reviewed commit on `main`. A preview should identify its build ID in a quiet debug/about location and avoid claiming that it is the public release. Do not change authentication/protection, custom domains, DNS, or other hosting settings without the required user authorization.

The release handover includes preview/production URL, exact source commit, host deployment ID where available, environment configuration, and test evidence. Verify the URL by opening the live application, not merely reading a successful build log.

## Static files and headers

Serve hashed JS/CSS/media with long-lived immutable caching and avoid indefinitely caching HTML or the service-worker update endpoint. Check correct MIME types for modules, audio, manifest, and models. Base paths and manifest scope must match the final deployment route. A nested-path refresh must work wherever routes are actually introduced.

Cloudflare Pages supports static response header configuration through `_headers`; see [S25](19-research-and-reuse.md). A future implementation can place this in the appropriate public/output path. The following is a starting policy to validate, not a tested drop-in production file:

```text
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; font-src 'self'
```

The style exception is intended for measured component styles/CSS variables and must be reviewed. Do not casually add script `unsafe-eval` or arbitrary origins to fix a development error. Start with report-only testing as appropriate, inspect actual violations, and tighten the shipping policy. Source for CSP behavior: [S26](19-research-and-reuse.md).

Add `X-Content-Type-Options: nosniff` and an appropriate referrer policy. Deny unused camera, microphone, and geolocation permissions; permit fullscreen/wake lock only as needed for the approved same-origin experience. Do not enable cross-origin isolation unless a measured feature requires it and embedding/media consequences are understood.

## Release procedure

1. Review requirement traceability, asset rights, and exact build output.
2. Deploy a release candidate preview and run live smoke tests there.
3. Resolve release blockers and record remaining supported/unsupported targets.
4. Promote the reviewed source commit through the repository workflow.
5. Deploy production and verify source/build identity, all five effects, audio activation, pause, offline behavior, and cache headers.
6. Record the deployment and keep the previous known-good release available.

The milestone is complete only after live checks. A 'deployment started' response is not a successful release.

## Rollback

Use the hosting provider's supported rollback or redeploy a known-good source commit; Cloudflare's rollback documentation is [S30](19-research-and-reuse.md). Never rewrite Git history to simulate rollback. Record the reverted deployment and reason.

Treat service-worker-controlled clients explicitly: an old worker may continue controlling a tab after a server rollback. Maintain versioned assets and a recovery/update procedure; test a client that already opened the bad build. Avoid deleting caches that a still-active old client needs. If required, publish a corrective worker version rather than endlessly asking people to refresh.

## Operations and maintenance

Local-only diagnostics are sufficient for V1. Add remote error monitoring only after a separate privacy/telemetry decision. Maintain dependency updates in reviewable branches and repeat backend/offline tests for rendering or PWA upgrades. Recheck current browser support and asset terms before major releases.

Operational checks: startup/asset failures, renderer errors, cache mismatch, increasing bundle size, sound regressions, and reported device heat/stutter. Capture reproducible environment/seed details rather than collecting broad device fingerprints. No scheduled monitoring automation or paid service is created as part of this plan.

## Hosting cost posture

A client-only static architecture avoids a database and per-launch inference/server workload. Hosting bandwidth and asset storage still depend on provider terms and usage; this document does not promise unlimited free hosting. Check the selected account's current terms during deployment. Keep assets within the intended offline/download budget and do not move to a server merely to manage local particles.
