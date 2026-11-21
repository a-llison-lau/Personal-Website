# Baking the bare room

The landing page draws the Nori "bare room" scene in real time. Its lighting is baked in Blender (Cycles) and its
colours are fitted to the Nori render from the same camera. These scripts do that; run them from this folder.

Needs Blender 4.4 (at `/Applications/Blender.app`), Python 3 with numpy and Pillow, and Firefox (for the probe).

1. **Bake** (about 15 minutes on a 4-core Intel CPU, in the background):
   `sh run.sh [path/to/bare_room.blend]` writes `work/bake/` and `work/bake.log`.
   - `bake.py` bakes, for the room, the sand, the skull and the rest of the skeleton, the surface colour (albedo,
     4096 px; 2048 for the skeleton) and the lighting (2048 px, denoised), as raw linear arrays.
   - The haze volume is left out (the fit below puts its glow back), and the room's true displacement is switched to
     bump: on the flattened copies it would buckle the walls and let thin lines of sun onto the sand.
   - Room faces nobody can see from inside the room get no texture space and are not exported.
   - `export.py` writes `work/bake/room.glb`.
2. **The Nori render as numbers** (once): `Blender -b --factory-startup --python nori_views.py -- scene_pm_oidn.exr work/nori`
   then rename `work/nori_lin.npy`.
3. **Fit and install**: `sh assemble.sh` renders the baked room from the render's camera (`probe/`), fits one gain
   and a smooth haze glow so it matches the Nori render (`fit.py`), writes the textures (`process.py`) and installs
   them into `public/model/`, with the fitted constants in the `LOOK` line of `public/index.html` (`install.py`).
   Check `work/fit/cmp_nori_pred.png`: Nori on top, the fitted web scene below.

`work/` is not committed.
