/**
 * The "CD" monogram as standalone SVG, with the letters converted to outlines so nothing
 * depends on Newsreader being installed where the SVG or PNG is viewed.
 */
import { resolve } from "node:path";
import * as fontkit from "fontkit";

const FONT = resolve(
	import.meta.dirname,
	"../node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2",
);

const WEIGHT = 600; // heavier than the 500 body weight so the strokes survive 16px
const TRACKING = -0.03; // em
const LETTER_SIZE = 32; // font size in viewBox units (box is 64)
const DOT_R = 3.2;
const DOT_GAP = 2.4;

const PALETTE = {
	light: { bg: "hsl(280, 50%, 90%)", fg: "hsl(280, 50%, 10%)", dot: "hsl(340, 80%, 20%)" },
	dark: { bg: "hsl(280, 50%, 10%)", fg: "hsl(280, 50%, 90%)", dot: "hsl(340, 80%, 80%)" },
};

const font = fontkit.openSync(FONT).getVariation({ wght: WEIGHT });
const scale = LETTER_SIZE / font.unitsPerEm;
const run = font.layout("CD");
const track = TRACKING * LETTER_SIZE;

// Pen positions in viewBox units (x only; baseline is shared).
let pen = 0;
const placed = run.glyphs.map((glyph, i) => {
	const x = pen;
	pen += run.positions[i].xAdvance * scale + track;
	return { glyph, x };
});
const textWidth = pen - track; // no trailing tracking
const groupWidth = textWidth + DOT_GAP + DOT_R * 2;
const originX = (64 - groupWidth) / 2;
const baseline = 32 + (font.capHeight * scale) / 2; // centre the caps vertically

const f = (n) => +n.toFixed(2);
function outline(glyph, x) {
	const tx = (px) => f(originX + x + px * scale);
	const ty = (py) => f(baseline - py * scale);
	return glyph.path.commands
		.map(({ command, args }) => {
			switch (command) {
				case "moveTo": return `M${tx(args[0])} ${ty(args[1])}`;
				case "lineTo": return `L${tx(args[0])} ${ty(args[1])}`;
				case "quadraticCurveTo": return `Q${tx(args[0])} ${ty(args[1])} ${tx(args[2])} ${ty(args[3])}`;
				case "bezierCurveTo": return `C${tx(args[0])} ${ty(args[1])} ${tx(args[2])} ${ty(args[3])} ${tx(args[4])} ${ty(args[5])}`;
				case "closePath": return "Z";
			}
		})
		.join("");
}
const letters = placed.map(({ glyph, x }) => outline(glyph, x)).join("");
const dot = { cx: f(originX + textWidth + DOT_GAP + DOT_R), cy: f(baseline - DOT_R), r: DOT_R };

/**
 * @param {{ scheme: "light" | "dark" | "auto"; size?: number; radius?: number; padding?: number }} opts
 *   radius: corner radius in viewBox units (default 14; 0 for square icons).
 *   padding: fraction of the box to shrink the mark toward the centre (default 0).
 */
export function markSvg({ scheme, size, radius = 14, padding = 0 }) {
	const dim = size ? ` width="${size}" height="${size}"` : "";
	const k = 1 - padding * 2;
	const t = `translate(${f(32 - 32 * k)} ${f(32 - 32 * k)}) scale(${f(k)})`;
	const shapes = `<g transform="${t}"><path class="fg" d="${letters}"/><circle class="dot" cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}"/></g>`;
	const rules = (p) =>
		`.bg{fill:${p.bg}}.fg{fill:${p.fg}}.dot{fill:${p.dot}}`;
	const style =
		scheme === "auto"
			? `${rules(PALETTE.light)}@media (prefers-color-scheme: dark){${rules(PALETTE.dark)}}`
			: rules(PALETTE[scheme]);
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"${dim}><style>${style}</style><rect class="bg" width="64" height="64" rx="${radius}"/>${shapes}</svg>`;
}
