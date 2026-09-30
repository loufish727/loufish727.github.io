# Asset Provenance

## Abstract Industrial Artwork

Created with Codex's built-in image-generation tool on September 30, 2026.
This is conceptual folded-metal artwork, not a depiction of actual machinery,
an engineering assembly, or a customer facility. No customer photo, equipment
record, or identity was sent for generation.

Project assets: `assets/abstract-metal-hero.webp` (1942 x 809, 102,546 bytes) and
`assets/abstract-metal-mobile.webp` (1050 pixels wide, 25,088 bytes). The generated PNG
was lossily encoded to WebP with Sharp, without adding objects or changing content.

Generation prompt:

> Generate a premium ABSTRACT brand artwork for MaintainOps, an industrial maintenance app. This is deliberately NONREPRESENTATIONAL artwork, not a factory, not a machine, not a rendering of equipment. Ultra-wide landscape 2.4:1 composition. A bold sculptural composition of broad folded brushed-aluminum bands, deep graphite planes and precise satin-metal facets sweeps diagonally through the RIGHT TWO THIRDS of the image. Visually striking overlapping angular forms, believable tactile metallic material and elegant studio reflections, rich physical depth, disciplined graphic-design composition. A few crisp cyan and ice-blue edge accents, one small restrained amber accent, subtle muted mint reflection. Predominantly neutral charcoal and silver, not dominated by blue. Crisp clear geometry, fewer large intentional forms instead of chaotic small parts. Left 40 percent is quiet nearly black graphite with fine material texture, genuinely empty of major objects, to support large HTML headline and buttons over it later. Main forms start around the middle and spread to the right edges, with enough negative space between surfaces to read the layering. Think high-end industrial product-brand campaign meets abstract folded metal sculpture, exceptionally polished, architectural and confident, NOT sci-fi machinery, no cyberpunk, no actual steel profiles, no rollers, no piping, no bolts, no cogs, no gears, no instruments, no conveyor, no control screens, no rooms, no buildings, no identifiable equipment, no literal processes, no people. No circles, orbs, bubbles, bokeh, particles, lightning or smoke. No typography, logo, text, labels, interface, card, border or watermark. Edge-to-edge raster artwork, almost photographic material rendering but unmistakably abstract art, not intended to depict an actual engineering assembly.

## Product Previews

`assets/workspace-work.webp`, `assets/workspace-equipment.webp`, and
`assets/workspace-planning.webp` are 1400 x 920 screenshots made locally by
`scripts/capture-product.cjs`. The script uses the existing app's navigation,
gauge, work-card, asset-card, and planning renderers and shared styles from
MaintainOps commit `b5e1383` (same source shipped in `c6d71dd`). The surrounding
example shell is composed locally; the images are not complete signed-in sessions.

Records, totals, assignments, and facilities are synthetic and visibly labeled
sample data. These are noninteractive images, not a live workspace. The tour tabs
only change which image is shown. All screenshots can be opened at full size.
The capture script blocks external requests and never loads app.js or a backend.

## Icons And Font

Icons and favicon reuse the app's existing `iconDisplay.js` artwork. The exported
SVG files and `assets/icon-masks.css` are generated, not a second hand-drawn set.
Inline SVG data URLs in CSS allow masks to render even from a local HTML file.

The wordmark uses self-hosted Oxanium (weights 600-700), and supporting text uses
Manrope (weights 400-800). Latin-subset variable WOFF2 files total 38,880 bytes:
`assets/oxanium-latin.woff2` (14,044 bytes) and `assets/manrope-latin.woff2`
(24,836 bytes). Both are preloaded; system fonts provide a loading/failure fallback.
No third-party font request is made by the page.

Files were retrieved from the official Google Fonts CSS service on September 30,
2026. Upstream sources and included SIL Open Font Licenses:

- Oxanium: https://github.com/google/fonts/tree/main/ofl/oxanium;
  `assets/Oxanium-LICENSE.txt`.
- Manrope: https://github.com/google/fonts/tree/main/ofl/manrope;
  `assets/Manrope-LICENSE.txt`.
