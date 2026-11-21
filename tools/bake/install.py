# Put the assembled textures, the haze map and the model into public/model, and write the fitted constants into
# the LOOK line of public/index.html.
#   python3 -I install.py BAKE_DIR ASSEMBLED_DIR FIT_DIR PUBLIC_DIR
import sys, os, json, re, shutil
bake, out, fit, public = sys.argv[1:5]
model = os.path.join(public, 'model')
for f in sorted(os.listdir(out)):
    if f.endswith('.webp'):
        shutil.copyfile(os.path.join(out, f), os.path.join(model, f))
shutil.copyfile(os.path.join(fit, 'haze.png'), os.path.join(model, 'haze.png'))
shutil.copyfile(os.path.join(bake, 'room.glb'), os.path.join(model, 'room.glb'))
g = json.load(open(os.path.join(fit, 'gain.json')))
r = lambda v: '[' + ', '.join(f'{x:.4f}' for x in v) + ']'
look = (f"const LOOK = {{ glass: {r(g['glass'])}, hazeMin: {r(g['haze_min'])}, hazeMax: {r(g['haze_max'])}, "
        f"hazeEdge: {r(g['haze_edge'])}, hazeYFov: 71.75 }};")
page = os.path.join(public, 'index.html')
s = open(page, encoding='utf-8').read()
s, n = re.subn(r'^const LOOK = \{.*\};$', look, s, flags=re.M)
assert n == 1, n
open(page, 'w', encoding='utf-8').write(s)
print(look)
for f in sorted(os.listdir(model)):
    print(f'{f:18s} {os.path.getsize(os.path.join(model, f)) // 1024:6d} KB')
