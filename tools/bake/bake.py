# Third bake: sharper textures and colours that can be matched to the Nori render afterwards.
# - Surface colour (albedo) and lighting are baked separately. Albedo is cheap, so it is baked at high resolution;
#   lighting is smooth, so it is baked at 2048 and denoised (safe: there is no texture detail in it to smear).
#   Both are saved as raw linear floats (.npy), never through a view transform, so process.py decides the colours.
# - Room faces that cannot be seen from anywhere inside the room (floor under the sand, outer wall faces, ...)
#   get no texture space; they stay in the scene as occluders but are not exported.
# - Sand: one top-down projection over the room's interior only (the plane runs on outside the walls).
# Run: Blender -b bare_room.blend --python bake.py -- OUTDIR [quick]
# The .blend is opened but never saved; OUTDIR/web_scene.blend is a working copy for export.py.
import bpy, bmesh, sys, os, math, time, random, json
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT = ARGS[0]
QUICK = len(ARGS) > 1 and ARGS[1] == 'quick'
os.makedirs(OUT, exist_ok=True)
#            albedo size, lighting size, lighting samples
PLAN = {'room': (4096, 2048, 32), 'sand': (4096, 2048, 24), 'skull': (4096, 2048, 48), 'bones': (2048, 2048, 32)}
if QUICK:
    PLAN = {k: (256, 128, 2) for k in PLAN}
ALBEDO_SAMPLES = 2 if QUICK else 4
SKULL_MATS = {'Buffelo_Skull.002', 'Buffelo_Horn.002', 'Buffelo_Jaw.002', 'Buffelo_Teeth.002'}
T0 = time.time()
def log(*a):
    print(f"[{time.time() - T0:7.1f}s]", *a, flush=True)

sc = bpy.data.scenes['Bare Room']
vl = sc.view_layers[0]
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.use_denoising = False
sc.cycles.use_adaptive_sampling = False
log("blender", bpy.app.version_string, "| view", sc.view_settings.view_transform)

with bpy.context.temp_override(scene=sc, view_layer=vl):
    bpy.data.objects.remove(bpy.data.objects['Cube.001'], do_unlink=True)  # haze volume: matched afterwards instead
    # The room's materials use true displacement, which Cycles only renders right on the original, adaptively
    # subdivided Main Room. On the flattened copies baked here it buckles the coarse walls and opens slits that let
    # thin lines of sun onto the sand. Bump keeps the surface detail on flat walls (Nori's walls are flat too).
    for mn in ('Wall', 'Ceiling', 'Floor', 'Wooden surface scan'):
        bpy.data.materials[mn].displacement_method = 'BUMP'
    dg = bpy.context.evaluated_depsgraph_get()

    def select_only(objs, active=None):
        for o in sc.objects:
            o.select_set(False)
        for o in objs:
            o.select_set(True)
        vl.objects.active = active or (objs[0] if objs else None)

    def realize(ob, name):
        """Copy of ob with modifiers applied; materials keep sampling their own UVs through a copy named 'tex'."""
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        new = bpy.data.objects.new(name, me)
        new.matrix_world = ob.matrix_world.copy()
        sc.collection.objects.link(new)
        if len(me.uv_layers):
            render_idx = next((i for i, l in enumerate(me.uv_layers) if l.active_render), 0)
            me.uv_layers.active_index = render_idx
            me.uv_layers.new(name='tex', do_init=True).active_render = True
        else:
            me.uv_layers.new(name='tex').active_render = True
        return new

    def split_faces(ob, pick, name):
        """Move the faces for which pick(face_index) is true out of ob into a new object called name."""
        part = ob.copy(); part.data = ob.data.copy(); part.name = name
        sc.collection.objects.link(part)
        chosen = {i for i in range(len(ob.data.polygons)) if pick(i)}
        for target, keep in ((part, True), (ob, False)):
            bm = bmesh.new(); bm.from_mesh(target.data); bm.faces.ensure_lookup_table()
            bmesh.ops.delete(bm, geom=[f for f in bm.faces if (f.index in chosen) != keep], context='FACES')
            bm.to_mesh(target.data); bm.free()
        return part

    def join(objs, name):
        select_only(objs, objs[0])
        bpy.ops.object.join()
        ob = vl.objects.active
        ob.name = name
        return ob

    # ---------- groups ----------
    room_src = ['Main Room', 'Window Bottom 1', 'Window Bottom 2', 'Shelf', 'Door',
                'Hindge Atachment', 'Hindge Atachment.001', 'Hindge Core', 'Hindge Core.001', 'Cube.002']
    room_parts, glass_parts = [], []
    for n in room_src:
        r = realize(bpy.data.objects[n], n + '__r')
        glass_idx = {i for i, s in enumerate(r.material_slots) if s.material and s.material.name == 'Glass'}
        if glass_idx:
            mi = [p.material_index for p in r.data.polygons]
            glass_parts.append(split_faces(r, lambda i, mi=mi, g=glass_idx: mi[i] in g, n + '__glass'))
        room_parts.append(r)
    sand = realize(bpy.data.objects['Plane'], 'sand')
    bones = realize(bpy.data.objects['buffelorips'], 'bones')
    bmi = [p.material_index for p in bones.data.polygons]
    skull_idx = {i for i, s in enumerate(bones.material_slots) if s.material and s.material.name in SKULL_MATS}
    skull = split_faces(bones, lambda i: bmi[i] in skull_idx, 'skull')
    for n in room_src + ['Plane', 'buffelorips']:
        bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
    room = join(room_parts, 'room')
    glass = join(glass_parts, 'glass')
    plain = bpy.data.materials.new('plain'); plain.use_nodes = True
    plain.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.62, 0.55, 0.47, 1)
    for ob in (room, sand, bones, skull):
        if not ob.material_slots:
            ob.data.materials.append(plain)
        for s in ob.material_slots:
            if s.material is None:
                s.material = plain
    log("faces:", {o.name: len(o.data.polygons) for o in (room, glass, sand, skull, bones)})

    # ---------- which room faces can be seen from inside the room ----------
    # Occluders: everything, glass included (it is drawn opaque on the web). Viewpoints: random points in the air
    # above the sand (nothing there rises above z = -0.35) plus the render camera, so any camera move inside the
    # room is covered. Faces are tested from both sides because the web draws them double-sided.
    occl_v, occl_f = [], []
    for ob in (room, glass, sand, bones, skull):
        mw = ob.matrix_world; base = len(occl_v)
        occl_v.extend(mw @ v.co for v in ob.data.vertices)
        occl_f.extend(tuple(base + i for i in p.vertices) for p in ob.data.polygons)
    bvh = BVHTree.FromPolygons(occl_v, occl_f, epsilon=0.0)
    rng = random.Random(7)
    cam = bpy.data.objects['Window'].matrix_world.translation.copy()
    views = [cam + Vector((dx, dy, dz)) for dx in (-0.12, 0.12) for dy in (-0.12, 0.12) for dz in (-0.06, 0.06)]
    views += [Vector((rng.uniform(-2.0, 1.42), rng.uniform(-2.22, 1.21), rng.uniform(-0.3, 1.18))) for _ in range(120)]
    mw = room.matrix_world
    seen = set()
    for p in room.data.polygons:
        vs = [mw @ room.data.vertices[i].co for i in p.vertices]
        n = (mw.to_3x3() @ p.normal).normalized()
        c = sum(vs, Vector()) / len(vs)
        area = p.area * abs(mw.determinant()) ** (2 / 3)
        pts = [c] + [c.lerp(v, 0.9) for v in vs]
        for _ in range(min(48, int(area / 0.01))):
            a, b = rng.random(), rng.random()
            i = rng.randrange(1, len(vs) - 1)
            if a + b > 1: a, b = 1 - a, 1 - b
            pts.append(vs[0] + (vs[i] - vs[0]) * a + (vs[i + 1] - vs[0]) * b)
        hit = False
        for q in pts:
            for v in views:
                d = v - q
                side = 1.0 if d.dot(n) >= 0 else -1.0
                o = q + n * (side * 2e-3)
                d = v - o; L = d.length
                if bvh.ray_cast(o, d / L, L - 1e-3)[0] is None:
                    hit = True; break
            if hit: break
        if hit:
            seen.add(p.index)
    # grow the visible set by one ring of neighbours: a face whose sliver of visibility the samples missed (a wall
    # strip mostly under the sand) borders a face that was seen
    n_seen = len(seen)
    seen_verts = {v for p in room.data.polygons if p.index in seen for v in p.vertices}
    seen |= {p.index for p in room.data.polygons if any(v in seen_verts for v in p.vertices)}
    log(f"room faces seen by samples: {n_seen}, with their neighbours: {len(seen)}")
    room_hidden = {p.index for p in room.data.polygons if p.index not in seen}
    log(f"room faces visible from inside: {len(seen)} / {len(room.data.polygons)}")

    # sand: the faces inside the room (with a margin) get texture space
    X0, X1, Y0, Y1, M = -2.16, 1.58, -2.38, 1.37, 0.06
    smw = sand.matrix_world
    cent = [smw @ p.center for p in sand.data.polygons]
    sand_hidden = {i for i in range(len(cent)) if not (X0 - M < cent[i].x < X1 + M and Y0 - M < cent[i].y < Y1 + M)}
    log(f"sand faces inside the room: {len(cent) - len(sand_hidden)} / {len(cent)}")

    # ---------- texture layouts ----------
    # Hidden faces stay in the same mesh while baking: split into a separate mesh, they leaked thin lines of
    # sunlight through the seam between the two. Their UVs all sit on one point, so they take no texture space
    # and receive nothing; they are deleted after baking.
    def collapse_uv(ob, faces):
        uv = ob.data.uv_layers['bake'].data
        for i in faces:
            for li in ob.data.polygons[i].loop_indices:
                uv[li].uv = (0.9995, 0.9995)

    def uv_area(ob, faces):
        uv = ob.data.uv_layers['bake'].data; tot = 0.0
        for i in faces:
            pts = [uv[li].uv for li in ob.data.polygons[i].loop_indices]
            tot += abs(sum(pts[j].x * pts[j - 1].y - pts[j - 1].x * pts[j].y for j in range(len(pts)))) / 2
        return tot

    def planar_uv(ob, hidden):
        me = ob.data
        uv = me.uv_layers.new(name='bake'); me.uv_layers.active = uv; me.uv_layers['tex'].active_render = True
        co = np.empty(len(me.vertices) * 3, dtype=np.float64); me.vertices.foreach_get('co', co)
        mwn = np.array(ob.matrix_world)
        world = co.reshape(-1, 3) @ mwn[:3, :3].T + mwn[:3, 3]
        used = sorted({v for p in me.polygons if p.index not in hidden for v in p.vertices})
        mn, mx = world[used, :2].min(axis=0), world[used, :2].max(axis=0)
        span = float((mx - mn).max())
        vi = np.empty(len(me.loops), dtype=np.int64); me.loops.foreach_get('vertex_index', vi)
        uvs = 0.002 + 0.996 * (world[vi, :2] - mn) / span
        uv.data.foreach_set('uv', uvs.astype(np.float32).ravel())
        collapse_uv(ob, hidden)
        # process.py needs the mapping to blank out texels that lie outside the room's walls
        json.dump({'min': [float(v) for v in mn], 'span': span, 'offset': 0.002, 'scale': 0.996,
                   'interior': [X0, X1, Y0, Y1]}, open(os.path.join(OUT, 'sand_uv.json'), 'w'))
        log(f"sand projection: {span:.3f} m across")

    def smart_uv(ob, angle, margin, hidden=()):
        me = ob.data
        uv = me.uv_layers.new(name='bake'); me.uv_layers.active = uv; me.uv_layers['tex'].active_render = True
        select_only([ob], ob)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.context.tool_settings.mesh_select_mode = (False, False, True)
        bm = bmesh.from_edit_mesh(me); bm.faces.ensure_lookup_table()
        for f in bm.faces:
            f.select_set(False)
        for f in bm.faces:
            if f.index not in hidden:
                f.select_set(True)
        bmesh.update_edit_mesh(me)
        bpy.ops.uv.smart_project(angle_limit=math.radians(angle), island_margin=margin, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
        bpy.ops.object.mode_set(mode='OBJECT')
        if hidden:
            before = uv_area(ob, hidden)
            collapse_uv(ob, hidden)
            log(f"{ob.name}: visible faces fill {uv_area(ob, set(range(len(me.polygons))) - set(hidden)):.0%} of the texture"
                f" (hidden faces had {before:.0%} before collapsing)")

    smart_uv(room, 66, 0.003, room_hidden)
    planar_uv(sand, sand_hidden)
    smart_uv(skull, 72, 0.004)
    smart_uv(bones, 66, 0.004)
    log("UVs done")

    # ---------- baking helpers ----------
    def pixels(img):
        w, h = img.size
        px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px)
        return px.reshape(h, w, 4)

    def fill_empty(a):
        """Push-pull fill of texels the bake did not reach, so no black bleeds in at any mip level."""
        rgb = a[..., :3].copy()
        valid = (a[..., 3] > 0.5).astype(np.float32) if (a[..., 3] < 0.5).any() else (rgb.max(axis=2) > 1e-6).astype(np.float32)
        levels = [(rgb * valid[..., None], valid)]
        while levels[-1][1].shape[0] > 1:
            c, m = levels[-1]; H, W = m.shape
            levels.append((c.reshape(H // 2, 2, W // 2, 2, 3).sum(axis=(1, 3)), m.reshape(H // 2, 2, W // 2, 2).sum(axis=(1, 3))))
        c, m = levels[-1]
        fill = c / np.maximum(m, 1e-6)[..., None]
        for c, m in reversed(levels[:-1]):
            up = np.repeat(np.repeat(fill, 2, axis=0), 2, axis=1)
            fill = np.where((m > 0)[..., None], c / np.maximum(m, 1e-6)[..., None], up)
        return np.where(valid[..., None] > 0, rgb, fill), valid

    bk = sc.render.bake
    bk.margin = 16; bk.margin_type = 'EXTEND'; bk.use_clear = True; bk.target = 'IMAGE_TEXTURES'

    def bake(ob, kind, size, samples):
        img = bpy.data.images.new(f"{ob.name}_{kind}", size, size, alpha=True, float_buffer=True)
        for s in ob.material_slots:
            nt = s.material.node_tree
            for n in [n for n in nt.nodes if n.name == '__bake']:
                nt.nodes.remove(n)
            node = nt.nodes.new('ShaderNodeTexImage'); node.name = '__bake'; node.image = img
            nt.nodes.active = node
        sc.cycles.samples = samples
        select_only([ob], ob)
        t = time.time()
        passes = {'COLOR'} if kind == 'albedo' else {'DIRECT', 'INDIRECT'}
        # albedo needs no light at all: without the sky and bounces each sample is a single shader evaluation
        world, bounces = sc.world, sc.cycles.max_bounces
        if kind == 'albedo':
            sc.world = None; sc.cycles.max_bounces = 0
        try:
            bpy.ops.object.bake(type='DIFFUSE', pass_filter=passes, uv_layer='bake', margin=16, use_clear=True)
        finally:
            sc.world = world; sc.cycles.max_bounces = bounces
        raw = pixels(img)
        al = raw[..., 3]
        log(f"   alpha min {al.min():.3f} max {al.max():.3f} >0.5: {(al > 0.5).mean():.0%} ==0: {(al == 0).mean():.0%} | rgb>0: {(raw[..., :3].max(axis=2) > 1e-6).mean():.0%}")
        if os.environ.get('BAKE_DEBUG'):
            np.save(os.path.join(OUT, f"{ob.name}_{kind}_rawdebug.npy"), raw.astype(np.float16))
        rgb, valid = fill_empty(raw)
        log(f"baked {ob.name} {kind} {size}px {samples}spp in {time.time() - t:.0f}s, coverage {valid.mean():.0%}, mean {rgb[valid > 0].mean(axis=0).round(4)}")
        bpy.data.images.remove(img)
        return rgb

    # ---------- denoise (compositor, HDR); the result is rendered to a temporary EXR and read straight back ----------
    dn = bpy.data.scenes.new('denoise')
    dcam = bpy.data.objects.new('dncam', bpy.data.cameras.new('dncam'))
    dn.collection.objects.link(dcam); dn.camera = dcam
    dn.render.engine = 'BLENDER_WORKBENCH'
    dn.view_settings.view_transform = 'Standard'
    dn.render.use_compositing = True; dn.render.use_sequencer = False; dn.use_nodes = True
    tree = dn.node_tree
    for n in list(tree.nodes):
        tree.nodes.remove(n)
    src = tree.nodes.new('CompositorNodeImage')
    den = tree.nodes.new('CompositorNodeDenoise'); den.use_hdr = True; den.prefilter = 'NONE'
    try:
        den.quality = 'HIGH'
    except Exception:
        pass
    comp = tree.nodes.new('CompositorNodeComposite')
    tree.links.new(src.outputs['Image'], den.inputs['Image'])
    tree.links.new(den.outputs['Image'], comp.inputs['Image'])
    dn.render.image_settings.file_format = 'OPEN_EXR'
    dn.render.image_settings.color_depth = '32'
    dn.render.image_settings.color_mode = 'RGBA'
    dn.render.image_settings.exr_codec = 'ZIP'

    def denoise(rgb):
        # A render written to EXR holds scene-linear values (no view transform); the mean check below would catch one.
        h, w, _ = rgb.shape
        im = bpy.data.images.new('dn_in', w, h, alpha=True, float_buffer=True)
        a = np.concatenate([rgb, np.ones((h, w, 1), np.float32)], axis=2)
        im.pixels.foreach_set(a.ravel())
        src.image = im
        dn.render.resolution_x, dn.render.resolution_y, dn.render.resolution_percentage = w, h, 100
        path = os.path.join(OUT, '_denoise_tmp.exr')
        dn.render.filepath = path
        with bpy.context.temp_override(scene=dn, view_layer=dn.view_layers[0]):
            bpy.ops.render.render(write_still=True, scene=dn.name)
        v = bpy.data.images.load(path)
        out = pixels(v)[..., :3].copy()
        bpy.data.images.remove(v); bpy.data.images.remove(im)
        os.remove(path)
        if out.shape != rgb.shape or not np.isfinite(out).all() or abs(out.mean() / max(rgb.mean(), 1e-6) - 1) > 0.05:
            log(f"!! denoise result unusable (shape {out.shape}, mean {out.mean():.4f} vs {rgb.mean():.4f}); keeping the noisy bake")
            return rgb
        return out

    # ---------- bake everything; arrays are saved bottom row first, exactly as Blender stores them ----------
    ONLY = set(filter(None, os.environ.get('ONLY', '').split(',')))  # bake just these (the layouts are deterministic)
    for ob in (room, sand, skull, bones):
        if ONLY and ob.name not in ONLY:
            continue
        asize, lsize, spp = PLAN[ob.name]
        alb = bake(ob, 'albedo', asize, ALBEDO_SAMPLES)
        np.save(os.path.join(OUT, f"{ob.name}_albedo.npy"), alb.astype(np.float16))
        del alb
        light = bake(ob, 'light', lsize, spp)
        np.save(os.path.join(OUT, f"{ob.name}_light_raw.npy"), light.astype(np.float16))
        t = time.time()
        light = denoise(light)
        np.save(os.path.join(OUT, f"{ob.name}_light.npy"), light.astype(np.float16))
        log(f"denoised {ob.name} in {time.time() - t:.0f}s")

    # ---------- keep only what the web needs, save a working copy for export.py ----------
    for ob, hidden in ((room, room_hidden), (sand, sand_hidden)):
        bm = bmesh.new(); bm.from_mesh(ob.data); bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[bm.faces[i] for i in hidden], context='FACES')
        bm.to_mesh(ob.data); bm.free()
        log(f"{ob.name}: {len(ob.data.polygons)} faces exported")
    for ob in (room, sand, skull, bones):
        me = ob.data
        for nm in [l.name for l in me.uv_layers if l.name != 'bake' and not l.name.startswith('.')]:
            layer = me.uv_layers.get(nm)
            if layer:
                me.uv_layers.remove(layer)
        me.materials.clear(); me.materials.append(bpy.data.materials.new(ob.name + '_baked'))
    glass.data.materials.clear(); glass.data.materials.append(bpy.data.materials.new('glass'))
    for nm in [l.name for l in glass.data.uv_layers if not l.name.startswith('.')]:
        layer = glass.data.uv_layers.get(nm)
        if layer:
            glass.data.uv_layers.remove(layer)
    keep = {'room', 'glass', 'sand', 'skull', 'bones', 'Window'}
    for o in [o for o in sc.objects if o.name not in keep]:
        bpy.data.objects.remove(o, do_unlink=True)
    for s in [s for s in bpy.data.scenes if s.name != sc.name]:
        bpy.data.scenes.remove(s)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'web_scene.blend'), copy=True, compress=True)
    log("saved web_scene.blend")
log("done")
