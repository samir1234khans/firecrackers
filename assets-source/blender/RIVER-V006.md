# Original living river assets v006

`masters/river-life-v006.blend` contains original individually editable source
geometry for two small wooden boats, a larger traditional nauka, and a distant shore village. It is a new
project; the existing waterfront, terrace, smoke, and rocket masters are preserved.
Blender 5.2.1 LTS and seeded procedural Python created the geometry and materials.

The boats have curved six-strake open hulls, plank thickness, a bent sheer gunwale,
interior floor slats, fitted benches, supports, a stowed oar, coiled mooring rope,
small cleats, and restrained lanterns. Variant A has a tackle crate, B a folded
fishing net, and C a larger dark-timber hull, bow storage cover, low woven arched
canopy with bent wooden ribs and edge cords, and four glass candle lanterns with
wax bodies, wicks, steady flame geometry, frames, short timber posts and brackets. They share
original rough wood, pitch, rope, aged fittings, and amber emissive PBR materials.

The village contains 12 varied pitched-roof homes in three unequal clusters of
four, three and five, with dark gaps, substantial depth staggering and individual
house yaw. Original per-house vertex colors give walls and roofs restrained muted
tones without a new texture map. Houses have actual roof overhangs, occasional
chimneys, wooden window frames and doors, and a stone quay. Four of
24 windows are warm; the remaining 20 stay dark. The emissive strength is .48
and the amber sources remain steady.

## Runtime contract

The preserved `renders/river-v006/exposed-lantern-export.glb` contains four named empty roots. This earlier procedural asset is no longer public; v007 replaces it. Origins are at
the local waterline center. Blender Z-up is exported to glTF/browser Y-up;
browser X is boat length and browser Z is beam.

| Root | Browser size X × Y × Z | Browser bounds Y | Mesh nodes |
| --- | --- | --- | --- |
| `Boat_A` | 5.571 × 1.776 × 1.859 | −.386…1.390 | 5 |
| `Boat_B` | 5.571 × 1.706 × 1.859 | −.386…1.320 | 5 |
| `Boat_C` | 9.582 × 2.790 × 3.012 | −.502…2.288 | 8 |
| `Shore_Village` | 90 × 4.842 × 13.011 | −.560…4.282 | 6 |

The hull dips below waterline Y=0. Place roots at the actual river surface rather
than lifting the hull bottoms above it. Scene pose, wind, visibility, reflection,
bobbing, and light intensity remain runtime decisions.

Lamp attachment empties use these local browser coordinates:

| Anchor | Local browser X, Y, Z |
| --- | --- |
| `Boat_A_Lamp` | .18, 1.22, −.24 |
| `Boat_B_Lamp` | −.30, 1.15, .21 |
| `Boat_C_Candle_01` | −3.10, 1.00, 1.04 |
| `Boat_C_Candle_02` | −3.10, 1.00, −1.04 |
| `Boat_C_Candle_03` | 3.10, 1.00, .76 |
| `Boat_C_Candle_04` | 3.10, 1.00, −.76 |
| `Boat_C_Lamp` | −3.10, 1.00, 1.04; compatibility marker at candle 01 |
| `Shore_Village_Warm_Lamp_01` | −31.82983, 1.33, 3.15075 |
| `Shore_Village_Warm_Lamp_02` | −6.59214, 1.22, −.78614 |
| `Shore_Village_Warm_Lamp_03` | 20.61609, 1.33, −2.82406 |
| `Shore_Village_Warm_Lamp_04` | 37.48157, 1.22, −1.61582 |

The emissive material name is `RiverLife | restrained amber emission`. The export
contains **no point lights, cameras, water, sky, fireworks, external images, or
cache files**. It is **486,964 bytes**, with **24 mesh nodes**, thirteen shared PBR
materials, and 14,690 imported vertices. Exact bounds and anchors are recorded
in `renders/river-v006/verification.json`.

## Editable master and bounded export

The master retains 443 objects, separate planks and details, editable bevel and
solidify modifiers, curve paths, named source collections, and original material
graphs. It saves before export or rendering.

Only evaluated duplicates export. They group by shared material inside each named
root. The distant browser geometry uses four-sided rope cross-sections, omits
small bevel subdivisions and unused UV attributes, and retains hull thickness,
silhouette, and structural details. These export changes do not save into the
editable master. The initial 1.41 MB export was rejected and optimized to the
388 KB first compact export. The later larger nauka, four candle lanterns and
clustered village fit into the 487 KB revised asset, below the 700 KB ceiling.

The preceding small-skiff master and GLB are preserved as
`renders/river-v006/pre-nauka-river-life-v006.blend` and `.glb`. A/B geometry and
their original attachment coordinates are unchanged. The village's four marker
coordinates update with its new house transforms; marker names remain stable.

The first larger-nauka iteration is preserved as
`renders/river-v006/nauka-canopy-lanterns-source.blend` and
`renders/river-v006/nauka-canopy-lanterns-export.glb`. A desktop browser capture
showed its candles hidden by the cloth. The final lanterns and attachment empties
sit on exposed bow/stern shoulders at X=±3.10, beyond the canopy ends at X=±2.65.
Calculated local hull half-widths there are 1.181 at the stern and .877 at the bow;
the final beam offsets of 1.04 and .76 keep the short posts and brackets attached
to the gunwale. Moving the lanterns does not increase overall boat bounds.

## Reproduce and verification

```powershell
$riverBlenderExe = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python 'assets-source\blender\build_river_life_v006.py' -- --build
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python 'assets-source\blender\build_river_life_v006.py' -- --pilot
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python 'assets-source\blender\build_river_life_v006.py' -- --verify
& $riverBlenderExe --background --factory-startup --disable-autoexec --python-exit-code 1 --python 'assets-source\blender\build_river_life_v006.py' -- --candle-pilot
```

`build-receipt.json` records the source/export counts. The final master was
reopened in a fresh Blender process. The GLB was reimported into a separate empty
scene, then verified for finite geometry, exact named roots and anchors, local
bounds, embedded PBR materials, mesh/file budgets, and absence of missing
dependencies or light/camera nodes.

Actual Cycles CPU night pilots use 32 samples at 800 × 500. The boat pilot shows
the geometry at the Z=0 waterline, and the village pilot shows the house silhouettes
and sparse warm windows. Four additional pose frames apply .027 vertical bob,
.008 roll, and .005 pitch in radians, for a restrained movement contact review.
These are illustrative poses, not fluid or physical buoyancy simulation. Temporary
water, camera, poses, and review lights are not saved into the master or exported.

The revised night pilots were visually inspected for the larger nauka silhouette,
curved canopy, dark timber, contact, irregular village clusters and muted surface
tones. Fresh GLB reimport confirmed the two village vertex-color meshes and four
candle markers. These source assets contain steady flame geometry; runtime candle
lighting, small flame motion and water fragments derive from those attachment points.

The four pose frames belong to the preceding canopy-lantern arrangement. The
final exposed-shoulder arrangement was rendered separately in
`renders/river-v006/nauka-exposed-candles-pilot.png`, using Cycles CPU, 32 samples
and 800 × 500 pixels. This actual geometry pilot was inspected for candle/post
attachment and canopy clearance. Browser candle visibility is validated separately.

The Blender geometry/material previews and contact frames are separate from live
website appearance, reflection synchronization, asset activation, and device
performance. The browser integration task validates those independently.
