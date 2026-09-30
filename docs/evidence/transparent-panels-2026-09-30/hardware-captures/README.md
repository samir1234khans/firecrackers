# Actual WebGPU panel captures

Captured against the qualified `.6` isolated preview with installed Chrome 154.0.8037.59 in headless mode, no software GPU flags. Both contexts assert active WebGPU, all eight authored assets, a nonfallback hardware adapter and the complete 60-entry release inventory. Four PNGs are unmodified originals with hashes and byte lengths in [the report](report.json). [Capture script](capture.mjs).

| View | Graphics | Grand picker |
| --- | --- | --- |
| Desktop 1280×800 | [Open PNG](desktop-graphics.png) | [Open PNG](desktop-picker.png) |
| Portrait 393×851 | [Open PNG](portrait-graphics.png) | [Open PNG](portrait-picker.png) |

Portrait/touch is emulated on this PC. The scripted context blocks service workers, explaining the visible offline-storage notice. These four captures establish appearance on actual hardware; the separate 56-check hardware suite and 195-check panel suite establish their respective behavior coverage. They are not physical-phone or performance qualification.
