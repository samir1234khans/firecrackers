# Graphics loading diagnosis — production build 2026-09-29.5

## Scope and method

Read-only checks against `https://firecrackers.mainandmany.com/` on 2026-09-29 used headless Chromium at 1280×800 and 393×851. The browser's WebGL renderer identified itself as `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`. This is **software rendering**, not physical phone or hardware GPU evidence. The graphics tests used the site's `?qa=1` diagnostics, with `?backend=webgl` and `?backend=canvas` for the comparison.

## Loading result

- Default desktop and mobile sessions reached `data-ready="true"` using WebGL 2 at Ultra quality. Forced Canvas reached `data-ready="true"` too.
- All six enhanced visuals were present in `data-assets`: `flame`, `normal`, `paper`, `rocket`, `terrace`, and `smoke`. On a cold session, each corresponding `/art/` request returned HTTP 200; no page errors, failed asset requests, or HTTP 4xx/5xx responses were observed.
- A fresh service worker registered on first visit. The next, service-worker-controlled visit loaded the same six assets and created the `firecrackers-art-v2` cache. A Cloudflare RUM telemetry request was aborted on that visit; it was unrelated to `/art/` loading.
- A launch produced a visible rocket and Gold Willow canopy in WebGL and Canvas screenshots. The canvas did not turn blank. In the 393×851 WebGL check, the Willow burst and its reflection were visible.

## Real-time playback result

The same selected Gold Willow was launched in separate 1280×800 sessions. The measurement collected `requestAnimationFrame` intervals for five seconds **without taking screenshots during the sample**:

| Backend | rAF callbacks | Median interval | 95th percentile | Longest interval | Site render frames | Site state at sample end |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| WebGL 2 on SwiftShader | 23 | 149.9 ms | 1099.9 ms | 1266.7 ms | 24 | Burst visible; 7,119 particles |
| Canvas 2D compatibility | 303 | 16.7 ms | 16.7 ms | 16.8 ms | 155 | Burst visible; 14,926 particles |

An earlier screenshot-assisted WebGL sample reached 21,011 live particles and had a median rAF interval of 150 ms, a 700 ms 95th percentile, and a 1067 ms longest interval. The screenshot-assisted timing includes capture overhead; the five-second sample above is the cleaner comparison. Browser image captures show the graphics visibly present even while WebGL animation stutters.

## Interpretation and limits

The public asset pipeline worked in these sessions. The reproducible problem is severe **software WebGL rendering delay**, which can make the graphics appear frozen or absent while the simulation continues. Asset download budget and particle admission are distinct from render cost. Raising particle and trail limits without addressing render capacity could increase that delay. This does not establish the cause on the user's device: hardware WebGPU/WebGL, Safari, physical phones, and the user's browser cache remain untested.

Temporary screenshots from this diagnostic session: `C:\Users\samir\AppData\Local\Temp\firecrackers-realtime-webgl-1.png` (ascent), `...\firecrackers-realtime-webgl-2.png` (WebGL canopy), `...\firecrackers-realtime-canvas-2.png` (Canvas canopy), and `...\firecrackers-diagnosis-mobile-default.png` (mobile WebGL canopy). These are temporary local files, not durable project artifacts.
