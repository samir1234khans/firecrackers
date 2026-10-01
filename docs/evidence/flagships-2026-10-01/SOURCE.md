# Candidate source and deployment receipt

This is an isolated review candidate, not a production release.

| Item | Verified value |
|---|---|
| Preview | https://firecrackers-flagship-preview.allygym-api.workers.dev/ |
| Branch | `feat/flagship-signatures` |
| Application source | `6af8dd647f81784720c92998b8cf4ad33506039f` |
| PR | [#26](https://github.com/samir1234khans/firecrackers/pull/26), open against main |
| Build | `2026-10-01.2` |
| Cloudflare Worker version | `30ea31d6-2467-4610-bbc9-a71e52ad2778` |
| Normalized source/art fingerprint | `68b3edd31b552121b7eda0f2262739093e03ef893fc8e2b93d2372f4fdde1b6d` (73 modules) |
| Deploy configuration | `wrangler.flagship-preview.jsonc`, no production routes |
| Application-source PR runtime CI | [36777344137](https://github.com/samir1234khans/firecrackers/actions/runs/36777344137), all four jobs passed |
| Source push documentation CI | [36777264092](https://github.com/samir1234khans/firecrackers/actions/runs/36777264092), passed |
| Source PR documentation CI | [36777343220](https://github.com/samir1234khans/firecrackers/actions/runs/36777343220), passed |

The subsequent evidence/touch-CI commit leaves the application fingerprint unchanged. Its latest checks are on PR #26; source-run job details are retained in [CI JSON](checks/flagship-ci-source.json). All 30 built files, including runtime bundles, service worker, art and audio, returned HTTP 200 and matched exact local SHA-256 bytes: [32 HTTP/source/assets checks](checks/http-assets.json).

## Baseline reconciliation and preservation

The requested moon/water candidate was clean at `b064fe43c87b9315afa91dda18364b88e70ee830`, branch `feat/moon-natural-water`, open [PR #25](https://github.com/samir1234khans/firecrackers/pull/25). [Its retained preview](https://firecrackers-moon-preview.allygym-api.workers.dev/) is build `2026-10-01.1`, Worker `f7cd640d-e774-44d3-bb16-62b4b012e6cb`, 69-module fingerprint `2e9aff20f01bdcbd7c57663d19c442b43b1eb305498795906f39b96048aaafc9`. PR #26 includes that unmerged baseline intentionally. Original lunar art, water coefficients, boats, scenery, ten seeded families and pinned dependencies are retained. No branches were deleted, reset or force-pushed.

Canonical main was `6fe052607c2ea50676d9320c9b66b13e11fa2dfb`. [Production](https://firecrackers.mainandmany.com/) still returns build `2026-09-30.8`, fingerprint `5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535`; its documented Worker remains `5a577d62-1deb-4770-b780-784d03574c7a`. No merge or production deployment was performed. Existing previews and rollback versions remain available.
