# Original smoke refinement v005

`masters/smoke-ignition-v005.blend` refines the three original volume materials from
`masters/smoke-ignition-v003.blend`. It retains the original smoke objects, ignition
flame, camera, light, animation range, and family IDs. No fluid solver or external
cache is required. The source master is preserved.

The materials provide editable ellipsoid radii, overlapping billow positions,
optical density, domain warp, large billows, medium eddies, and fine turbulence.
Their 4D noise animates through 48 Blender frames at 24 fps. Runtime scale, wind,
light position, and lifetime remain the renderer's responsibility.

The export `public/art/smoke-density-light-v005.png` keeps the original contract:

| Property | Value |
| --- | --- |
| Dimensions | 528 × 1584 pixels |
| Families | Fuse, motor, burst; original order |
| Frames | 16 per family, four columns |
| Cell | 128 pixels with 2 pixels empty padding on each side |
| Color space | Non-Color, linear data |
| Channels | R extinction density; G/B signed projected-density gradients; A opacity |
| File size | 555,389 bytes |
| Render | Blender 5.2.1 LTS, Cycles CPU, 20 samples |
| Full bake elapsed time | 73.99 seconds |

The PNG stores density data rather than a display-transformed smoke photograph.
Use the existing data texture sampler and family UV orientation. The G/B gradients
allow the browser shader to shade the lobes toward the actual firework light while
preserving absorption in dense interiors.

## Reproduce

From the repository root, run each operation in a separate process:

```powershell
$smokeBlenderExe = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
& $smokeBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python 'assets-source\blender\build_smoke_v005.py' -- --build
& $smokeBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python 'assets-source\blender\build_smoke_v005.py' -- --pilot
& $smokeBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python 'assets-source\blender\build_smoke_v005.py' -- --bake
& $smokeBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python 'assets-source\blender\build_smoke_v005.py' -- --verify
python 'assets-source\blender\review_smoke_v005.py'
```

The review script needs Python, NumPy, and Pillow. Blender itself performs the
volume rendering and atlas bake using its embedded NumPy. `--pack-export` repacks
an existing baked atlas into the master without rerendering.

## Evidence

The original source was inventoried with the skill's `scene_report.py` before edits.
Two nine-frame pilot passes exposed and corrected overly smooth oval silhouettes.
The final 48-frame motion contact sheet and 12 representative frames were visually
inspected for silhouette continuity and empty boundaries. A short playback GIF is
provided for review; it uses the exported density with an illustrative review light,
not the live website shader. The source noise sequence is an evolving sprite and is
not claimed to loop seamlessly; the runtime interpolates frames and controls fade.

The final master was reopened in a fresh Blender process. It contains the packed
atlas, all six original objects, and three named refined volume materials with no
missing dependencies. The exported atlas was reloaded independently and checked for
finite values, dimensions, R/A equality, and zero padding opacity. All 48 cell edges
are empty. Maximum adjacent-frame mean density change is 0.01654, with peak opacity
0.97598. This is a data continuity measure, not proof of website performance.

Evidence files are under `renders/smoke-v005/`: `bake-receipt.json`,
`verification.json`, `scene-report.json`, `representative-frames.png`,
`motion-contact-sheet.png`, and `smoke-playback.gif`.

These are original procedural assets authored for Firecrackers. Browser appearance,
asset activation, offline behavior, and hardware renderer checks are validated by
the integration task independently from Blender source verification.
