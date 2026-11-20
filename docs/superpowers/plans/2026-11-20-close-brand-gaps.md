# Close the Brand Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the already-committed favicon, icons and share cards in line with the approved design: outlined CD mark with rose dot, light/dark tab icon, mark on the share cards, multi-size `.ico`, padded maskable icon.

**Architecture:** One new module, `scripts/brand-mark.mjs`, owns the "CD" mark as outlined SVG paths (read once from the Newsreader font file with fontkit). `scripts/generate-brand.mjs` uses it for every output (favicon.svg, PNG icons, `.ico`, share cards), so no output depends on a font being installed on the visitor's or any other machine.

**Tech Stack:** Node ESM scripts, `fontkit` (new devDependency, pnpm), headless Chrome (already used by the script), Astro static site.

**Spec:** `docs/superpowers/specs/2026-11-20-favicon-and-seo-images-design.md`

## Global Constraints

- Palette (from `src/styles/global.css`): ink `hsl(280, 50%, 10%)`, paper `hsl(280, 50%, 90%)`, rose `hsl(340, 80%, 20%)` (light) / `hsl(340, 80%, 80%)` (dark).
- Mark is "CD" in Newsreader, weight raised and tracking tightened, plus one rose dot; text converted to outlines.
- Tab icon: lavender square + plum letters; dark mode inverts via `prefers-color-scheme` inside the SVG.
- `apple-touch-icon`, `icon-192`, `icon-512` are solid-background (no transparency, no dark switching).
- `favicon.ico` contains 16, 32 and 48px images.
- Share cards stay 1200x630 and always use the light palette.
- Existing meta wiring in `src/layouts/Layout.astro` is already correct and is not touched.
- Generated assets are committed; the script stays the way to regenerate them.

## Review Focus

- Machine without Newsreader installed: favicon.svg and every PNG must still show the Newsreader letterforms (no `<text>` left in any SVG).
- 16px tab size: the dot must not merge with the D or vanish; "CD" must stay readable.
- Dark mode: dot colour must stay visible on the plum square (uses the light rose).
- Maskable crop: letters and dot must lie inside the central 80% circle of `icon-512-maskable.png`.
- Chrome missing at the default path: script must exit with a clear message naming the `CHROME` env var, not a stack trace.
- Long case-study titles on cards must not collide with the new mark in the header row.

---

### Task 1: Outlined mark module and the tab icon SVG

**Files:**
- Create: `scripts/brand-mark.mjs`
- Modify: `scripts/generate-brand.mjs` (write `public/favicon.svg` from the module)
- Modify: `public/favicon.svg` (generated output)
- Modify: `package.json`, `pnpm-lock.yaml` (`pnpm add -D fontkit`)

**Interfaces:**
- Produces: `export function markSvg(opts: { scheme: "light" | "dark" | "auto"; size?: number; radius?: number; padding?: number }): string` returning a standalone `<svg>` (viewBox `0 0 64 64`, `width`/`height` = `size` when given). `scheme: "light"` is lavender square with plum letters and dark rose dot; `"dark"` is the inverse with light rose dot; `"auto"` embeds both via a `<style>` with `@media (prefers-color-scheme: dark)`. `radius` is the corner radius in viewBox units (default 14, 0 for square icons). `padding` shrinks the mark toward the centre as a fraction of the viewBox (default 0), used for the maskable icon.
- Consumed by: Tasks 2 and 3.

- [ ] **Step 1: Add `fontkit` as a devDependency** with `pnpm add -D fontkit`.
- [ ] **Step 2: Implement `markSvg`** in `scripts/brand-mark.mjs`. Open `node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2` with fontkit, apply variation `{ wght: 600 }` (raise from the current 500 for 16px legibility), lay out "CD" with about -0.03em tracking, centre it in the 64 box, and emit the glyph outlines as one `<path>`. Place a rose dot (radius about 3 units) on the baseline just right of the D. Fine-tune weight, tracking and dot position by eye at 16, 32 and 512px.
- [ ] **Step 3: Write `public/favicon.svg`** from `markSvg({ scheme: "auto" })` in `generate-brand.mjs`, and make the script print a clear error naming `CHROME` if the Chrome binary does not exist.
- [ ] **Step 4: Verify.** Run `node scripts/generate-brand.mjs`, then `grep -c "<text" public/favicon.svg` (expect `0`) and `grep -c "prefers-color-scheme" public/favicon.svg` (expect `1`). Open the SVG in Chrome in light and dark mode and check at 16px that the dot is distinct from the D and that "CD" is readable.
- [ ] **Step 5: Commit** `feat(brand): outline the CD mark, add rose dot and dark-mode tab icon`.

### Task 2: Raster icons, multi-size ICO, padded maskable icon

**Files:**
- Modify: `scripts/generate-brand.mjs` (icon section)
- Modify: `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/favicon-48.png`, `public/favicon.ico` (generated)
- Create: `public/icon-512-maskable.png` (generated)
- Modify: `public/manifest.webmanifest`

**Interfaces:**
- Consumes: `markSvg` from Task 1.

- [ ] **Step 1: Replace the HTML `icon()` helper** so every raster icon is a Chrome screenshot of `markSvg({ scheme: "light", size, radius: 0 })` (square, solid; iOS and Android round it). Keep `favicon-48.png` with `radius: 14`.
- [ ] **Step 2: Add `icon-512-maskable.png`** from `markSvg({ scheme: "light", size: 512, radius: 0, padding: 0.2 })` so letters and dot sit inside the central 80% circle, and keep `icon-512.png` unpadded.
- [ ] **Step 3: Build `favicon.ico` with three images** (16, 32, 48px, each rendered with `radius: 14`). Write an ICO container with a directory of 3 entries, PNG payloads, correct per-entry width/height/size/offset.
- [ ] **Step 4: Update `manifest.webmanifest`:** `icon-512.png` with `"purpose": "any"`, `icon-512-maskable.png` with `"purpose": "maskable"`, `icon-192.png` unchanged.
- [ ] **Step 5: Verify.** Run `node scripts/generate-brand.mjs`; `file public/icon-512-maskable.png public/apple-touch-icon.png` (expect 512x512 and 180x180); `node -e "const b=require('fs').readFileSync('public/favicon.ico');console.log(b.readUInt16LE(4))"` (expect `3`); `node -e "JSON.parse(require('fs').readFileSync('public/manifest.webmanifest','utf8'))"` exits 0. View the maskable icon and confirm nothing falls outside a circle of 80% of its width.
- [ ] **Step 6: Commit** `feat(brand): multi-size ico, maskable icon and solid raster icons from the outlined mark`.

### Task 3: Mark on the share cards, then full check

**Files:**
- Modify: `scripts/generate-brand.mjs` (`card()` helper)
- Modify: `public/og/*.png` (generated)

**Interfaces:**
- Consumes: `markSvg` from Task 1.

- [ ] **Step 1: Change the header row of `card()`** to show `markSvg({ scheme: "light", size: 88 })` to the left of "Carlos Daniel" (flex row, 24px gap). The rest of the layout stays as is. This keeps the existing case-study cards rather than rebuilding them as the single-card layout sketched in the design, so it is my call and Carlos should check it.
- [ ] **Step 2: Run** `node scripts/generate-brand.mjs` and view `public/og/home.png` and `public/og/rag-agent.png` (the longest title). Check that no text overlaps the mark and the lavender mark stays visible against the lavender card (it has its plum square, so it should).
- [ ] **Step 3: Full check.** `pnpm build` succeeds; `file public/og/*.png` shows 1200 x 630 for all five; `git status` shows only the files listed in this plan.
- [ ] **Step 4: Commit** `feat(brand): add the CD mark to the share cards`.
