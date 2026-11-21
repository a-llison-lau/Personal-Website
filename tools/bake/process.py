# Turn bake.py's linear albedo + lighting arrays into web textures.
#   python3 -I process.py combine BAKE_DIR            -> BAKE_DIR/{name}_L.npy (linear radiance at albedo resolution)
#   python3 -I process.py probe BAKE_DIR OUT_DIR SIZE  -> OUT_DIR/{x1,x32}/{name}.png: radiance x1 and /32, for measuring
#   python3 -I process.py final BAKE_DIR OUT_DIR GAIN.json -> OUT_DIR/{name}.webp (full) and {name}_2k.webp
# Arrays from Blender are stored bottom row first; image files are written top row first (as Blender writes them),
# which is what the GLB's UVs expect with flipY = false.
import sys, os, json
import numpy as np
from PIL import Image

NAMES = ['room', 'sand', 'skull', 'bones']

def srgb(x):
    x = np.clip(x, 0.0, 1.0)
    return np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(x, 1 / 2.4) - 0.055)

def resize(a, size):
    """Bilinear (up) or area (down) resize of an (H, W, 3) float array, channel by channel."""
    if a.shape[0] == size:
        return a
    f = Image.BILINEAR if size > a.shape[0] else Image.BOX
    return np.stack([np.asarray(Image.fromarray(np.ascontiguousarray(a[..., c]), 'F').resize((size, size), f)) for c in range(3)], -1)

def to_image(rgb01):
    return Image.fromarray(np.round(srgb(rgb01)[::-1] * 255).astype(np.uint8), 'RGB')

def push_pull(rgb, valid):
    """Fill texels where valid is 0 from their surroundings, at every scale."""
    levels = [(rgb * valid[..., None], valid)]
    while levels[-1][1].shape[0] > 1:
        c, m = levels[-1]; H, W = m.shape
        levels.append((c.reshape(H // 2, 2, W // 2, 2, 3).sum(axis=(1, 3)), m.reshape(H // 2, 2, W // 2, 2).sum(axis=(1, 3))))
    c, m = levels[-1]
    fill = c / np.maximum(m, 1e-6)[..., None]
    for c, m in reversed(levels[:-1]):
        up = np.repeat(np.repeat(fill, 2, axis=0), 2, axis=1)
        fill = np.where((m > 0)[..., None], c / np.maximum(m, 1e-6)[..., None], up)
    return np.where(valid[..., None] > 0, rgb, fill)

def inside_room(size, uvmap):
    """Which texels of the top-down sand texture lie inside the room's walls (rows bottom first, like the arrays)."""
    t = (np.arange(size) + 0.5) / size
    world = lambda c: uvmap['min'][c] + (t - uvmap['offset']) / uvmap['scale'] * uvmap['span']
    x, y = world(0), world(1)
    x0, x1, y0, y1 = uvmap['interior']
    return ((y[:, None] >= y0) & (y[:, None] <= y1) & (x[None, :] >= x0) & (x[None, :] <= x1)).astype(np.float32)

cmd, bake = sys.argv[1], sys.argv[2]
if cmd == 'combine':
    for n in NAMES:
        alb = np.load(os.path.join(bake, f'{n}_albedo.npy')).astype(np.float32)
        light = np.load(os.path.join(bake, f'{n}_light.npy')).astype(np.float32)
        uvp = os.path.join(bake, 'sand_uv.json')
        if n == 'sand' and os.path.exists(uvp):
            # sand just outside the walls lies in full sun; refill it from the inside so it can't bleed in at the walls
            light = push_pull(light, inside_room(light.shape[0], json.load(open(uvp))))
        L = alb * resize(np.maximum(light, 0), alb.shape[0])
        np.save(os.path.join(bake, f'{n}_L.npy'), L.astype(np.float16))
        print(n, alb.shape[0], 'px, radiance mean', L.reshape(-1, 3).mean(0).round(3), 'p99', np.percentile(L.reshape(-1, 3), 99, axis=0).round(2))
elif cmd == 'probe':
    out, size = sys.argv[3], int(sys.argv[4])
    for sub, s in (('x1', 1.0), ('x32', 1 / 32)):
        os.makedirs(os.path.join(out, sub), exist_ok=True)
        for n in NAMES:
            L = resize(np.load(os.path.join(bake, f'{n}_L.npy')).astype(np.float32), size)
            to_image(L * s).save(os.path.join(out, sub, f'{n}.png'))
    print('probe textures written to', out)
elif cmd == 'final':
    out, gain = sys.argv[3], json.load(open(sys.argv[4]))
    os.makedirs(out, exist_ok=True)
    for n in NAMES:
        k = np.array(gain['k'][n], np.float32)  # this object's fitted gain (fit.py)
        L = np.load(os.path.join(bake, f'{n}_L.npy')).astype(np.float32) * k
        full = L.shape[0]
        to_image(L).save(os.path.join(out, f'{n}.webp'), quality=90, method=6)
        if full > 2048:
            to_image(resize(L, 2048)).save(os.path.join(out, f'{n}_2k.webp'), quality=90, method=6)
        print('wrote', n, full, os.path.getsize(os.path.join(out, f'{n}.webp')) // 1024, 'KB')
