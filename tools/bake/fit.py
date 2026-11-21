# Fit the baked room's colours to the Nori render, seen from the same camera.
#   python3 -I fit.py X1.png X32.png IDS.png NORI_LIN.npy OUT_DIR
# X1/X32: the web scene rendered with radiance x1 and x1/32 (merged into one linear HDR image);
# IDS: flat object colours (which pixel is which object); NORI_LIN: the Nori render, linear, same size, top row first.
# Model, per pixel and channel:  nori = k[object] * baked + haze,  with haze smooth across the image.
# The haze field stands for what the bake cannot hold: the lit haze volume between the camera and the walls,
# plus any other slow difference between the two renderers. k is set by the image detail (texture, sun-patch edges),
# which the smooth haze cannot explain. Writes OUT_DIR/gain.json, OUT_DIR/haze.png and diagnostic images.
import sys, os, json
import numpy as np
from PIL import Image

x1p, x32p, idp, norip, out = sys.argv[1:6]
os.makedirs(out, exist_ok=True)
SIGMA = float(os.environ.get('SIGMA', 28))  # haze smoothness, in pixels of the 1600 x 900 frame

def dec(u8):
    x = u8.astype(np.float32) / 255
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)
def enc(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(x, 1 / 2.4) - 0.055)
def blur1(a, r, axis):
    # box blur of radius r along axis, edges clamped
    pad = [(0, 0)] * a.ndim; pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis)
    n = a.shape[axis]
    hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
    lo = np.take(c, np.arange(0, n), axis=axis)
    return (hi - lo) / (2 * r + 1)
def gauss(a, sigma):
    r = max(1, int(round(np.sqrt(12 * sigma * sigma / 3 + 1) / 2)))  # three box passes ~ a gaussian of this sigma
    for _ in range(3):
        a = blur1(blur1(a, r, 0), r, 1)
    return a
def masked_blur(x, w, sigma):
    num = gauss(x * w[..., None], sigma); den = gauss(w, sigma)[..., None]
    return num / np.maximum(den, 1e-4), den[..., 0]

A = dec(np.asarray(Image.open(x1p).convert('RGB')))
B = dec(np.asarray(Image.open(x32p).convert('RGB'))) * 32
L = np.where(A < 0.9, A, B)                     # radiance the web shows, before any clipping
N = np.load(norip).astype(np.float32)
ids = np.asarray(Image.open(idp).convert('RGB')).astype(int)
H, W, _ = L.shape
assert N.shape == L.shape, (N.shape, L.shape)
OBJ = {'room': (255, 0, 0), 'sand': (0, 255, 0), 'skull': (0, 0, 255), 'bones': (255, 255, 0), 'glass': (255, 255, 255)}
masks = {k: (np.abs(ids - np.array(v)).sum(-1) < 30) for k, v in OBJ.items()}
def erode(m, r):
    # a pixel survives if its whole (2r+1)^2 box is inside the mask
    return gauss(m.astype(np.float32), r / 1.7) > 0.999
inner = {k: erode(m, 3) for k, m in masks.items()}
surf = np.zeros((H, W), bool)
for k in ('room', 'sand', 'skull', 'bones'):
    surf |= inner[k]
objmap = np.full((H, W), -1)
NAMES = ['room', 'sand', 'skull', 'bones']
for i, k in enumerate(NAMES):
    objmap[masks[k]] = i

# ---- gains from image detail: band-pass both images, so the smooth haze drops out of the comparison ----
# (the finest scale is left out too: there the two differ by resolution, antialiasing and tiny misalignments)
w = surf.astype(np.float32)
def band(x):
    return masked_blur(x, w, 1.5)[0] - masked_blur(x, w, SIGMA)[0]
bN, bL = band(N), band(L)
g0 = (w[..., None] * N * L).sum((0, 1)) / (w[..., None] * L * L).sum((0, 1))  # naive: one gain, no haze
def robust_gain(m):
    kk = (bN[m] * bL[m]).sum(0) / np.maximum((bL[m] ** 2).sum(0), 1e-9)
    for _ in range(8):
        e = bN[m] - kk * bL[m]
        s = 1.4826 * np.median(np.abs(e), axis=0) + 1e-6
        rw = 1 / np.maximum(1, np.abs(e) / (2.0 * s))   # Huber: misaligned bits (sun patches, sashes) count less
        kk = (rw * bN[m] * bL[m]).sum(0) / np.maximum((rw * bL[m] ** 2).sum(0), 1e-9)
    corr = [np.corrcoef(bN[m][:, c], bL[m][:, c])[0, 1] for c in range(3)]
    return np.maximum(kk, 1e-4), np.round(corr, 3)
kg, cg = robust_gain(surf)
print('naive single gain', np.round(g0, 4), '| detail gain, all surfaces', np.round(kg, 4), 'corr', cg)
k = {}
for n in NAMES:
    if inner[n].sum() < 2000:
        k[n] = kg; print(f"{n:5s} too few pixels, uses the shared gain"); continue
    kn, cn = robust_gain(inner[n])
    print(f"{n:5s} detail gain {np.round(kn, 4)} corr {cn} ({inner[n].sum()} px)")
    k[n] = kn if os.environ.get('PER_OBJECT') else kg
def kfield():
    K = np.ones((H, W, 3), np.float32)
    for i, n in enumerate(NAMES):
        K[objmap == i] = k[n]
    return K
K = kfield()
# final haze over the whole frame (surfaces only drive it; holes, glass and edges are filled from around them).
# Pixels the smooth haze cannot explain (sun patches that differ between the two scenes, bones buried in one and
# not the other) are left out, so they don't spread into glowing or dark halos.
r = N - K * L
h, den = masked_blur(r, w, SIGMA)
w2 = w
for _ in range(4):
    e = np.abs(r - h)
    s = 1.4826 * np.median(e[w2 > 0], axis=0) + 1e-6
    w2 = w * ((e / s).max(-1) < 2.5)
    h, den = masked_blur(r, w2, SIGMA)
print(f"haze drawn from {w2.sum() / w.sum():.0%} of the surface pixels")
far, _ = masked_blur(r, w2, SIGMA * 6)
h = np.where(den[..., None] > 0.05, h, far)
glass = inner['glass']
glass_col = np.median((N - h)[glass], axis=0) if glass.sum() > 100 else np.array([1, 0.9, 0.72])
pred = K * L + h
pred[masks['glass']] = (glass_col + h)[masks['glass']]
print('glass colour (linear)', np.round(glass_col, 3))
print('haze mean', np.round(h.mean((0, 1)), 4), 'min', np.round(h.min((0, 1)), 4), 'max', np.round(h.max((0, 1)), 4))
for n in NAMES:
    m = inner[n]
    print(f"{n:5s} mean display error before/after: "
          f"{np.abs(enc(L[m] * g0) - enc(N[m])).mean() * 255:5.1f} -> {np.abs(enc(pred[m]) - enc(N[m])).mean() * 255:5.1f}")

# ---- outputs ----
# The haze is stored signed: haze.png holds (h - min) / (max - min), sRGB-encoded, at 400 x 225.
hs = np.stack([np.asarray(Image.fromarray(np.ascontiguousarray(h[..., c]), 'F').resize((400, 225), Image.BOX)) for c in range(3)], -1)
hmin, hmax = hs.reshape(-1, 3).min(0), hs.reshape(-1, 3).max(0)
hmax = np.maximum(hmax, hmin + 1e-4)
Image.fromarray(np.round(enc((hs - hmin) / (hmax - hmin)) * 255).astype(np.uint8), 'RGB').save(os.path.join(out, 'haze.png'))
band = np.ones((225, 400), bool); band[20:-20, 36:-36] = False
json.dump({'k': {n: [float(v) for v in k[n]] for n in NAMES}, 'glass': [float(v) for v in glass_col],
           'haze_min': [float(v) for v in hmin], 'haze_max': [float(v) for v in hmax], 'haze_edge': [float(v) for v in hs[band].mean(0)],
           'haze_mean': [float(v) for v in hs.reshape(-1, 3).mean(0)], 'sigma': SIGMA}, open(os.path.join(out, 'gain.json'), 'w'), indent=1)
hp = np.maximum(h, 0)
Image.fromarray(np.round(enc(pred) * 255).astype(np.uint8)).save(os.path.join(out, 'pred.png'))
Image.fromarray(np.round(enc(K * L) * 255).astype(np.uint8)).save(os.path.join(out, 'kl.png'))
Nd, Pd, Ld = enc(N), enc(pred), enc(L * g0)
Image.fromarray((np.concatenate([Nd, Pd], 0) * 255).astype(np.uint8)).resize((800, 900)).save(os.path.join(out, 'cmp_nori_pred.png'))
Image.fromarray((enc(hp / max(hmax.max(), 1e-4)) * 255).astype(np.uint8)).resize((800, 450)).save(os.path.join(out, 'haze_view.png'))
print('wrote', out)
