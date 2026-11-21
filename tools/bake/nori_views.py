# Load the Nori EXR (linear), write a 1600x900 linear .npy plus PNGs through Filmic and Standard.
import bpy, sys, numpy as np
src, out = sys.argv[sys.argv.index('--') + 1:][:2]
img = bpy.data.images.load(src)
w, h = img.size
px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px)
a = px.reshape(h, w, 4)[::-1, :, :3]  # top row first
f = w // 1600 if w % 1600 == 0 else None
# box-downsample 3840x2160 -> 1600x900 via area averaging (factor 2.4): use 2x then resize by averaging in numpy
from math import floor
def area_resize(a, W, H):
    h, w, c = a.shape
    ys = np.linspace(0, h, H + 1); xs = np.linspace(0, w, W + 1)
    # integral image
    I = np.zeros((h + 1, w + 1, c), np.float64); I[1:, 1:] = a.cumsum(0).cumsum(1)
    def S(y, x):
        y0 = np.floor(y).astype(int); x0 = np.floor(x).astype(int)
        return I[y0][:, x0]
    yi = np.round(ys).astype(int); xi = np.round(xs).astype(int)
    tot = I[yi[1:]][:, xi[1:]] - I[yi[:-1]][:, xi[1:]] - I[yi[1:]][:, xi[:-1]] + I[yi[:-1]][:, xi[:-1]]
    area = np.outer(np.diff(yi), np.diff(xi))[..., None]
    return (tot / area).astype(np.float32)
small = area_resize(a, 1600, 900)
np.save(out + '_lin.npy', small)
print('lin stats mean', small.mean((0, 1)), 'p99', np.percentile(small, 99, axis=(0, 1)), 'max', small.max((0, 1)))
# write through view transforms
sc = bpy.context.scene
cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam
sc.render.engine = 'BLENDER_WORKBENCH'
sc.render.use_compositing = True; sc.render.use_sequencer = False; sc.use_nodes = True
tree = sc.node_tree
for n in list(tree.nodes): tree.nodes.remove(n)
s = tree.nodes.new('CompositorNodeImage'); s.image = img
c = tree.nodes.new('CompositorNodeComposite'); tree.links.new(s.outputs['Image'], c.inputs['Image'])
sc.render.resolution_x, sc.render.resolution_y = w, h
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGB'
for vt in ('Filmic', 'Standard'):
    sc.view_settings.view_transform = vt; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0; sc.view_settings.gamma = 1
    sc.render.filepath = out + '_' + vt + '.png'
    bpy.ops.render.render(write_still=True)
print('DONE')
