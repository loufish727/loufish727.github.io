# Asset Provenance

## Factory Artwork

Created with Codex's built-in image-generation tool on September 30, 2026.
This is an illustrative production-floor scene, not a photograph of a customer
facility. No customer photo, equipment record, or identity was sent for generation.

Project assets: `assets/factory-hero.webp` (1942 x 809, 197,262 bytes) and
`assets/factory-mobile.webp` (1050 pixels wide, 76,902 bytes). The generated PNG
was lossily encoded to WebP with Sharp, without adding objects or changing content.

Generation prompt:

> Create a photorealistic editorial advertising photograph for MaintainOps, an industrial maintenance operations web app. Landscape cinematic ultra-wide composition 2.4:1. A real sheet-metal fabrication production floor, meticulously detailed roll-forming machinery, polished rollers, galvanized steel sheets, restrained safety yellow rails, charcoal control cabinets, authentic industrial steel roof structure. Camera at human eye level looking down the machine line from a 3/4 perspective. The main equipment is clearly recognizable and sharply detailed across the center and right two thirds, lit with convincing neutral-white factory daylight and subtle cool cyan instrument accents; silver metal, graphite, a little industrial amber. The left third is a quiet dark charcoal machine enclosure with relatively little detail, natural falloff leaving room for a white HTML headline to be placed over it later. Premium precision-machinery campaign photo, realistic material wear and believable engineering, not gloomy, not foggy, no neon cyberpunk, no gradients as artwork, no glowing floating elements, no people, no fake screens, no logos, absolutely NO text or lettering. The production line should feel real, not a sci-fi room. Edge to edge photograph, no frame, no UI, no typography, no split panel.

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

The self-hosted Barlow Condensed Bold font is distributed under the SIL Open Font
License in `assets/FONT-LICENSE.txt`. Downloaded from the official Google Fonts
repository: https://github.com/google/fonts/tree/main/ofl/barlowcondensed.
Body text uses the visitor's system font. No third-party font request is made.
