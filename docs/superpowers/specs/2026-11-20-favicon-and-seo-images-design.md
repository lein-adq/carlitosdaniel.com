# Favicon and SEO images: design

## Intent
The site still ships Astro's starter favicon and has no share image. Replace both with a "CD" monogram so the tab icon and link previews (LinkedIn, Slack, X) identify Carlos Daniel and fit the site's editorial look.

## Goals
- One mark, used in the tab icon and on the share card.
- Full icon set: `favicon.svg`, `favicon.ico`, 180px apple-touch-icon, 192px and 512px icons, `site.webmanifest`.
- A 1200x630 `og:image`, with `twitter:card` changed to `summary_large_image`.
- Tab icon works in light and dark mode.

## Non-goals / anti-goals
- No second visual style. Nothing that looks bolted on to the existing site.
- No per-page share images (a single default for now).
- Must stay legible at 16px; a pretty mark that blurs in the tab is a failure.

## Constraints
- Palette from `src/styles/global.css`: plum ink `hsl(280 50% 10%)`, lavender paper `hsl(280 50% 90%)`, rose `hsl(340 80% 20%/80%)`, blue `hsl(220 80% 20%/80%)`.
- Fonts already in the project: Newsreader (serif), Inter, JetBrains Mono.
- Meta tags live in `src/layouts/Layout.astro`; static files in `public/`.

## Approaches considered
1. **Serif monogram (chosen).** Newsreader "CD", plum on lavender, small rose accent. Matches the site; strokes thickened for small sizes.
2. Bold geometric nested C/D on a plum square. Crisp but unrelated to the site's personality.
3. Serif monogram plus hand-drawn Caveat swash. Most distinctive, but the swash vanishes at tab size.

Carlos picked option 1. The hand-drawn swash may be added to the share card later.

## Design
- **Mark:** "CD" in Newsreader, weight raised and letter-spacing tightened so it holds at 16px. The text is converted to outlines so the SVG does not depend on the font being installed. Rose dot as the single accent.
- **Tab icon:** rounded lavender square with plum letters. Dark mode inverts it (plum square, lavender letters) through `prefers-color-scheme` inside the SVG, as the current favicon does.
- **Raster icons:** generated from the SVG at 180, 192 and 512px, plus a multi-size `.ico` (16, 32, 48). The apple-touch-icon and the 512px icon use a solid background with padding, since iOS and Android do not support transparency or dark-mode switching there.
- **Share card (1200x630):** lavender paper background, large CD mark on the left, "Carlos Daniel" in Newsreader with "Backend & AI Engineer" below it, and the domain in JetBrains Mono. Faint diagram-style lines in the accent colours on the right. Always the light palette.
- **Wiring:** `<link>` tags for the icons and manifest, `og:image` (absolute URL, with width, height and alt), `twitter:image`, `twitter:card=summary_large_image`. `Layout.astro` takes an optional `image` prop that defaults to the share card.

## Left to the builder
- Rasterising tool (for example sharp or resvg; whichever is already installed or lightest to add).
- Exact stroke weights and accent placement, checked by eye at 16, 32 and 512px.
- The generation script goes in `scripts/` so the assets can be regenerated; the outputs are committed.
