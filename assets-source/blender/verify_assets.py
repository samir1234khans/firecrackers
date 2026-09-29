import bpy,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT.parents[1]/'outputs'/'blender';ART=ROOT/'public'/'art'
report={'blender':bpy.app.version_string,'masters':[],'roundTrips':[]}
for name in ['smoke-ignition','rocket-materials','waterfront']:
    path=OUT/(name+'-v003.blend');bpy.ops.wm.open_mainfile(filepath=str(path))
    missing=[i.filepath for i in bpy.data.images if i.source=='FILE' and not i.packed_file and not Path(bpy.path.abspath(i.filepath)).exists()]
    assert not missing,missing
    report['masters'].append({'path':path.name,'objects':len(bpy.data.objects),'materials':len(bpy.data.materials),'frames':[bpy.context.scene.frame_start,bpy.context.scene.frame_end],'missingDependencies':missing})
for name in ['rocket','terrace']:
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(ART/(name+'.glb')))
    meshes=[o for o in bpy.data.objects if o.type=='MESH'];assert meshes
    assert all(math.isfinite(c) for o in meshes for v in o.data.vertices for c in v.co)
    report['roundTrips'].append({'file':name+'.glb','meshCount':len(meshes),'vertices':sum(len(o.data.vertices) for o in meshes),'names':[o.name for o in meshes],'finite':True})
(OUT/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
