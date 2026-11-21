# Export the third bake's working copy (web_scene.blend from bake.py) to GLB, in a fresh process.
# Run: Blender -b OUTDIR/web_scene.blend --python export.py -- OUTDIR
import bpy, sys, os
OUT = sys.argv[sys.argv.index('--') + 1:][0]
names = ['room', 'glass', 'sand', 'skull', 'bones', 'Window']
for o in bpy.context.scene.objects:
    o.select_set(o.name in names)
bpy.context.view_layer.objects.active = bpy.data.objects['room']
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'room.glb'), export_format='GLB', use_selection=True,
                          export_cameras=True, export_lights=False, export_apply=True, export_texcoords=True,
                          export_normals=False, export_materials='EXPORT', export_yup=True,
                          export_vertex_color='NONE', export_all_vertex_colors=False)
print("EXPORTED", os.path.getsize(os.path.join(OUT, 'room.glb')), "bytes", sorted(o.name for o in bpy.context.selected_objects))
