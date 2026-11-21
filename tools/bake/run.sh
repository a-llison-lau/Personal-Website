#!/bin/sh
# Bake the bare room (bake.py), then export the GLB (export.py), in a session of its own so it survives the terminal
# closing; caffeinate keeps the Mac awake. Takes about 15 minutes on a 4-core Intel CPU.
#   sh run.sh [path/to/bare_room.blend] [OUT_DIR]        then follow it with: tail -f OUT_DIR.log
# Set ONLY=room (or sand, skull, bones; comma-separated) to re-bake just those; the texture layouts are deterministic,
# so the other objects' arrays can be copied over from a previous bake.
cd "$(dirname "$0")"
B=/Applications/Blender.app/Contents/MacOS/Blender
SRC=${1:-"$HOME/Desktop/ETH Zurich/Autumn-25/computer-graphics/nori/scenes/nori-beyond/bare_room/bare_room.blend"}
OUT=${2:-work/bake}
mkdir -p "$(dirname "$OUT")"; rm -rf "$OUT"
JOB="caffeinate -i '$B' -b '$SRC' --python bake.py -- '$OUT' 2>&1 | grep -E '^\[|Error|Traceback'; '$B' -b '$OUT/web_scene.blend' --python export.py -- '$OUT' 2>&1 | grep -E 'EXPORTED|Error|Traceback'; echo JOB_FINISHED"
python3 -I -c "
import subprocess, sys
p = subprocess.Popen(['/bin/sh', '-c', sys.argv[1]], start_new_session=True, stdout=open(sys.argv[2] + '.log', 'w'), stderr=subprocess.STDOUT)
print('baking as pid', p.pid, '- log:', sys.argv[2] + '.log')" "$JOB" "$OUT"
