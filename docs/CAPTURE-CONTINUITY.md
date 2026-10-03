# Capture continuity correction

## Evidence and scope

Independent FFmpeg decoding of the combined music/V4 exports from run `37145991829` found one video frame in each short desktop clip despite valid non-silent stereo audio. A bounded read-only trace in `37146718289` confirmed that the scene was unpaused, simulation time advanced and the copy canvas received multiple draws. A first-frame/decode smoke check alone was therefore insufficient.

The candidate uses feature-detected `CanvasCaptureMediaStreamTrack.requestFrame()` after each completed copy, with a zero-rate manual stream. Browsers without the method retain the existing 24 Hz timed stream; the unused probe stream is stopped. Frame copying remains on the application's presented-render path, throttled by the existing limit, with no second render loop or change to show quantity, clock, sound, comfort settings, image dimensions or byte limits. Disposal clears the callback and stops tracks/audio taps.

A read-only combined-source experiment in run `37147178393` retained all four raw files. Its browser flows and audio/pixel checks passed; the runner's independent-decoder step failed because FFprobe was not installed. Local FFmpeg inspection of the exact retained ZIP (artifact `11283161521`, SHA-256 `c7232eafda700fcecdc1d8bb79e92f547b735402f63f179d3769d0c28b5dcf59`) found 2, 5, 2 and 4 distinct encoded frames in the four short exports respectively. This confirms more than a static image, not a smooth frame-rate or physical-device qualification.

## Permanent regression contract

Six unit contracts cover manual delivery, fallback cleanup, security-error propagation, draw-before-request ordering, renderer replacement and disposal. `test:capture-continuity` exercises actual scene/UI recording in desktop/phone-emulated WebGL and Canvas, with both manual delivery and the legacy capability fallback. It deliberately advances a changing scene in bounded steps and independently decodes the resulting file with FFmpeg, requiring multiple distinct video frames. This is a transport/lifecycle test, not real-time performance evidence. Silent captures must not gain an unexpected audio track.

The read-only CI workflow installs FFmpeg explicitly and retains raw media, metadata and failures. It tests checked-out PR/main source directly; the temporary two-checkout diagnostic and source substitution are not part of the final workflow. Final exact-head results belong in the PR receipt.

This correction does not change simulation/replay semantics or the recipe engine version; the source/asset fingerprint includes the changed capture module. It does not import or release held musical PR #33. Real-device Safari/WebGPU support, sustained recording performance and listening/flash qualification remain separate. Source promotion does not deploy Cloudflare.

References: MDN `CanvasCaptureMediaStreamTrack.requestFrame` and W3C Media Capture from DOM Elements specify manual capture timing; the method is feature-detected because browser support differs.
