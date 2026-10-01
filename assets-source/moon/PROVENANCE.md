# Lunar disc provenance — 1 October 2026

Credit: NASA's Scientific Visualization Studio; Ernie Wright (USRA), Noah Petro (NASA/GSFC), LRO/LROC and LOLA instrument teams.

Primary source: [NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/). Its 2025 LROC color mosaic and LOLA elevation preview are intended for rendering. [NASA imagery usage](https://www.nasa.gov/nasa-brand-center/images-and-media/) permits informational webpages and graphical simulations with acknowledgement, subject to any separately identified rights. No NASA logos or endorsement are used. This does not assign an application license.

Direct SVS downloads repeatedly timed out on this host. Retrieval used the documented mirror in MaxwellLee/physics-lab, pinned at `50174d07bad4795ce568051e7656d7544607e82c`, with its source/processing receipt retained by the upstream repository:

| Retained file | Primary source | Mirror processing | SHA-256 |
| --- | --- | --- | --- |
| lroc_color_2k.jpg | https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg | moon_2048.jpg, same 2048×1024 dimensions, JPEG quality 93 re-encoding; not byte-identical to NASA original | ec98386c3b39ad2dab5970db5b5aecb8946db3f450aee4d78ce7382e0060bf87 |
| ldem_3_8bit.jpg | https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg | moon_height_1024.jpg, upstream states byte-preserved 1024×512 preview; direct-source hash not independently checked | 6d93f887e7d8bedfe35ab89ba785e5e3ca12381bd092a5e6abe2c707dda8bb98 |

Mirror paths: `https://raw.githubusercontent.com/MaxwellLee/physics-lab/50174d07bad4795ce568051e7656d7544607e82c/assets/textures/` followed by `moon_2048.jpg`, `moon_height_1024.jpg` and `SOURCES.md`.

Run `python scripts/generate-moon.py` from the repository root with NumPy and Pillow. The script projects the near side orthographically, applies fixed gibbous lighting in linear color, subtle preview-derived relief and antialiased alpha, then downsamples to the delivered 512×512 RGBA PNG (319,502 bytes). Only that PNG is downloaded by the app. Source maps are excluded from the deployment.

The 8-bit height preview is a visual bump source, not physical elevation in meters. The light direction, phase, apparent diameter and sky position are art direction, not current astronomical observations. The dark limb remains opaque inside the disc to cover background stars; a separate restrained atmospheric aureole is rendered around it. GPU and Canvas use the same delivered disc.
