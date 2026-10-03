# Original cinematic show music

Moonlit Silver, Golden Celebration and Prismatic Grand are original synthesized instrumental compositions generated for this project by `scripts/generate-show-music.py`. The tracked generator and manifest record melodies, chord progressions, seeds, format and asset hashes. No third-party recording, melody, soundfont, impulse response or music-generation service is used. This document does not assign a new application license.

Each score is 90 seconds at 96 BPM with six 15-second phrases. Delivered recordings are stereo 24 kHz / 16-bit FLAC with 75 ms handles on both ends. Runtime resampling and decoded-memory bounds are checked independently. WAV masters/previews are generated into ignored `test-results/music-source` and are not shipped.

Development encoding uses official FLAC 1.5.0 Windows binaries from [Xiph](https://xiph.org/flac/download.html), verified against the release directory's SHA256SUMS.txt. The encoder is not bundled in the app. Its developer-tool license and notices remain in its downloaded package.
