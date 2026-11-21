"""Copy the Work and Reel content from their own pages onto the walls of the 3D room.

public/work.html and public/reel.html are the source: edit the part between <!--pg:work--> ... <!--/pg:work-->
(or the reel markers) there, then run

    python3 tools/sync_walls.py

and the same block is written into public/index.html, where it hangs on the room's left (Work) and right (Reel)
walls. On the walls the page title is an <h2> (the landing's <h1> is the name), and the reel's YouTube iframe becomes
a slot naming the video: the landing lays the player over the wall in 2D, and only once the Reel is first opened.
"""
import pathlib, re, sys

PUBLIC = pathlib.Path(__file__).resolve().parent.parent / 'public'

def block(text, key):
    start, end = f'<!--pg:{key}-->', f'<!--/pg:{key}-->'
    i, j = text.index(start), text.index(end)
    return i, j + len(end), text[i:j + len(end)]

def main():
    index = (PUBLIC / 'index.html').read_text(encoding='utf-8')
    changed = []
    for key in ('work', 'reel'):
        _, _, src = block((PUBLIC / f'{key}.html').read_text(encoding='utf-8'), key)
        src = src.replace('<h1 class="pg-title"', '<h2 class="pg-title"').replace('</h1>', '</h2>')
        if key == 'reel':
            # the player is laid over the wall in 2D by the landing's script; the wall only names the video
            src = re.sub(r'<iframe src="([^"]+)"[^>]*></iframe>', r'<span class="pg-video-slot" data-src="\1"></span>', src)
        i, j, old = block(index, key)
        if old != src:
            index = index[:i] + src + index[j:]
            changed.append(key)
    (PUBLIC / 'index.html').write_text(index, encoding='utf-8')
    if changed:
        print('updated the ' + ' and '.join(changed) + ' wall' + ('s' if len(changed) > 1 else '') + ' in public/index.html')
    else:
        print('the walls already match work.html and reel.html')

if __name__ == '__main__':
    sys.exit(main())
