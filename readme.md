# Allison Lau

Personal website: https://allison-lau.vercel.app

A static site, no build step. Everything that is served lives in `public/`:

- `index.html`: the landing page, a real-time 3D room (three.js) with the Work and Reel pages hanging on its walls.
- `work.html`, `reel.html`: the same Work and Reel content as pages of their own (for browsers without WebGL, and for links).
- `nori.html`: the Nori renderer write-up.
- `404.html`, `robots.txt`, `sitemap.xml`.
- `pages.css`, `pages.js`: styles and behaviour shared by Work and Reel. `fonts.css` and `fonts/`: self-hosted fonts.
- `model/`: the room (glTF) and its baked textures. `img/`: images. `vendor/`: three.js 0.160 and KaTeX (MIT licensed).

## Editing

- **Work or Reel**: edit `public/work.html` or `public/reel.html` between the `<!--pg:work-->` / `<!--pg:reel-->`
  markers, then run `python3 tools/sync_walls.py` to copy the change onto the room's walls in `public/index.html`.
- **Landing text**: in `public/index.html` (the name, roles and the introduction paragraph).
- **Nori**: `public/nori.html` is plain HTML (equations are pre-rendered KaTeX).
- **The 3D room**: see `tools/bake/README.md`.

## Preview locally

    npx serve public

(`serve` understands the clean URLs such as `/work`; `python3 -m http.server -d public` works too, but then open `/work.html`.)

## Deploy

Push to `main`; Vercel deploys it. `vercel.json` tells Vercel there is nothing to install or build and to serve `public/`
with clean URLs.
