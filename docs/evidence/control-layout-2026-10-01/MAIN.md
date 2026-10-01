# Main integration — 1 October 2026

The approved moon/water, three signature fireworks and open-sky controls were promoted to canonical `main` in their source dependency order. All three original PR branches and isolated previews were preserved.

| Change | PR | Feature head | Main merge commit |
| --- | --- | --- | --- |
| LRO moon and natural waterfront motion | [#25](https://github.com/samir1234khans/firecrackers/pull/25) | `b064fe43c87b9315afa91dda18364b88e70ee830` | `c67ac4014fe5cfdb9db485c6859d01b4d14f9d4d` |
| Imperial Crown, Celestial Aurora and Royal Phoenix | [#26](https://github.com/samir1234khans/firecrackers/pull/26) | `7946153d44a3ad42de8cdbb5b792af7b19c7f6f5` | `54589574e9219c743755c0a07ae0367d1afa74c1` |
| Transparent left collection, responsive launch support, moon-led startup | [#27](https://github.com/samir1234khans/firecrackers/pull/27) | `087e3bc82cb7b5d4ccf59a783ae703ccb1069db0` | `8e6240c26eac64aa085aff995eed801bbe7d15c9` |

The canonical checkout was clean before promotion and was fast-forwarded to `8e6240c`. No user changes or branches were reset or force-pushed. Each PR had passing engine, desktop, mobile, recovery and documentation checks before merge. The final open-sky PR run is [36793417119](https://github.com/samir1234khans/firecrackers/actions/runs/36793417119). The merged source has its own [main push CI run](https://github.com/samir1234khans/firecrackers/actions/runs/36797916108).

Build `2026-10-01.3` has delivered-source fingerprint `c12b1d0bde59ba1e0967c9bbda00768d8c645078267ade88c9f42a7b60af0637`. The [isolated Cloudflare preview](https://firecrackers-open-sky-preview.allygym-api.workers.dev/) serves that fingerprint, Worker `15f3c3a7-b056-4929-89de-b4754a93d5a6`. [Matched captures and moon video](comparison.html), [preview validation](PREVIEW.md), [signature evidence](../flagships-2026-10-01/PREVIEW.md) and [moon/water evidence](../moon-water-2026-10-01/PREVIEW.md) remain available.

[Production](https://firecrackers.mainandmany.com/) still serves build `2026-09-30.8`, fingerprint `5a0020b7c9260140d4fff57a6abe97d53f7406dedffc6635c64148facb478535`, Worker `5a577d62-1deb-4770-b780-784d03574c7a`. The main merge did not invoke the Cloudflare production deploy command. That Worker remains the production rollback boundary. Physical phones, Safari, browser-bar changes, real OS zoom and sustained GPU/thermal performance remain unqualified.
