# Cloudflare production release — 29 September 2026

## Identity and delivery

- Source: `samir1234khans/firecrackers`, clean canonical `main` at `63dfff2fcc9e7d46a3b9a9c3f3185a188f92813e` before the deployment configuration/documentation branch. The new branch does not change application modules.
- Build: `2026-09-29.1`, from the committed lockfile with Node 24.19.0. `npm run typecheck`, `npm run lint`, `npm test` (105 passed) and `npm run build` passed locally. Main Runtime validation, Documentation validation and Main promotion verification GitHub runs at that SHA passed.
- Host: Cloudflare Worker `firecrackers` on account `f5410d9ca88997f8d2c4f033194abbfc`, version `c2cbc9f9-e058-4220-9c27-dcd7d32bac9f`. Wrangler 4.143.0 uploaded 14 static files and attached `firecrackers.mainandmany.com`. The prior AppDeploy preview was preserved.
- Public: https://firecrackers.mainandmany.com/ and https://firecrackers.allygym-api.workers.dev/ . Public `/release.json` returned 35 modules and normalized SHA-256 `615d4997ce54ce87812f4bb9b568f24d3057fa374d68f5692d8a74ebbcba4d1a`, matching the local production build.

## Live checks

- Cloudflare custom domain returned HTTPS 200 and served the production HTML, hashed JavaScript, service worker and release receipt. Public DNS at 1.1.1.1 resolved the new A/AAAA records. The local router still cached an earlier negative DNS result during verification, so direct domain requests used the resolved Cloudflare IP while retaining the real hostname and TLS certificate.
- Desktop and 375-pixel mobile Chromium opened the custom domain, reached a ready Canvas scene and accepted a launch without page errors. These two checks used Chromium's host resolver override for the local router cache.
- The Worker hostname, which serves the same deployed version, passed 43 Grand Collection checks (desktop/mobile, WebGL/Canvas), 29 original launch/platform checks and 15 viewability/recovery checks: 87 passed, 0 failed. Public desktop and mobile screenshots were inspected. The original suite included production offline reload and recovery controls.
- `npm audit --omit=dev --audit-level=moderate` reported zero production dependency advisories before publishing. After adding pinned Wrangler and overriding its transitive Undici dependency to 7.29.1, `npm audit --audit-level=moderate` reported zero advisories for the deployment branch.

## Scope and follow-up

Browser checks used Chromium software graphics and emulated mobile viewports, not physical-device or hardware WebGPU evidence. Safari/iOS, actual Android/tablet, sustained GPU/thermal performance, OBS, comprehensive flash/accessibility assessment and owner art/audio approval remain open as in the Grand Collection delivery record.

For another release, fetch current `main`, install from the lockfile with Node 22.16.0 or newer, run the checks in `DEVELOPMENT.md`, then run `npm run cloudflare:deploy`. Verify the returned version and live source fingerprint and rerun public browser checks. Keep the prior Worker version for rollback; do not infer application behavior from a successful upload alone.
