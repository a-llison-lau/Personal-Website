#!/bin/sh
# From a finished bake to the site: combine albedo x lighting, render the web scene from the Nori camera,
# fit the colours to the Nori render, write the textures and install them into public/.
#   sh assemble.sh [BAKE_DIR]      (needs work/nori_lin.npy from nori_views.py, Firefox for the probe)
set -e
cd "$(dirname "$0")"
BAKE=${1:-work/bake}
W=work; SITE=$W/probe-site; FOV=71.74998111456664
python3 -I process.py combine "$BAKE"
rm -rf "$SITE"; mkdir -p "$SITE/p"; cp probe/probe.html "$SITE/"; cp "$BAKE/room.glb" "$SITE/p/room.glb"
python3 -I process.py probe "$BAKE" "$SITE/p" 2048
python3 -I probe/probe.py "$SITE" \
  "$W/x1.png=probe.html?dir=p/x1&ext=png&glb=p/room.glb&fov=$FOV" \
  "$W/x32.png=probe.html?dir=p/x32&ext=png&scale=0.03125&glb=p/room.glb&fov=$FOV" \
  "$W/ids.png=probe.html?ids=1&glb=p/room.glb&fov=$FOV"
python3 -I fit.py "$W/x1.png" "$W/x32.png" "$W/ids.png" "$W/nori_lin.npy" "$W/fit"
python3 -I process.py final "$BAKE" "$W/out" "$W/fit/gain.json"
python3 -I install.py "$BAKE" "$W/out" "$W/fit" ../../public
echo "installed into public/ - check $W/fit/cmp_nori_pred.png (top: Nori, bottom: the fitted web scene)"
