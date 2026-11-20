/**
 * Generates the social-share images (public/og/*.png), the PNG app icons and favicon.ico
 * using headless Chrome and the site's own self-hosted fonts.
 *
 *   node scripts/generate-brand.mjs
 *
 * Re-run after changing a case study's title/stack or the palette. Output is committed.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { markSvg } from "./brand-mark.mjs";

const root = resolve(import.meta.dirname, "..");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(CHROME)) {
	console.error(`Chrome not found at "${CHROME}". Set the CHROME env var to your Chrome/Chromium binary.`);
	process.exit(1);
}
const fonts = (f) => `file://${root}/node_modules/@fontsource-variable/${f}`;
const tmp = mkdtempSync(join(tmpdir(), "brand-"));

const css = `
@font-face{font-family:"Newsreader";src:url(${fonts("newsreader/files/newsreader-latin-wght-normal.woff2")});font-weight:200 800}
@font-face{font-family:"Inter";src:url(${fonts("inter/files/inter-latin-wght-normal.woff2")});font-weight:100 900}
:root{--paper:hsl(280,50%,90%);--ink:hsl(280,50%,10%);--link:hsl(340,80%,20%);--soft:hsl(280,25%,28%)}
*{box-sizing:border-box;margin:0}
html,body{width:100%;height:100%;background:var(--paper);color:var(--ink);font-family:Inter,sans-serif}
`;

function shot(html, out, w, h) {
	const file = join(tmp, `${Math.random().toString(36).slice(2)}.html`);
	writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>${css}</style>${html}`);
	execFileSync(CHROME, [
		"--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
		`--window-size=${w},${h}`, "--virtual-time-budget=4000", `--screenshot=${out}`, `file://${file}`,
	], { stdio: "ignore" });
}

// ---- Tab icon (outlined, light/dark) ----------------------------------------
writeFileSync(join(root, "public/favicon.svg"), markSvg({ scheme: "auto" }) + "\n");

// ---- Social share cards (1200x630) -----------------------------------------
const card = ({ kicker, title, sub }) => `
<div style="position:relative;width:1200px;height:630px;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between">
  <div style="position:absolute;left:0;top:0;bottom:0;width:14px;background:var(--link)"></div>
  <div style="font-family:Newsreader;font-size:34px;font-weight:500">Carlos Daniel</div>
  <div>
    <div style="font-size:26px;color:var(--link);font-weight:600;letter-spacing:.02em;margin-bottom:22px">${kicker}</div>
    <div style="font-family:Newsreader;font-weight:400;font-size:${title.length > 44 ? 68 : 82}px;line-height:1.05;letter-spacing:-.02em;max-width:1000px">${title}</div>
    <div style="font-size:28px;color:var(--soft);margin-top:30px">${sub}</div>
  </div>
  <div style="font-size:24px;color:var(--soft)">carlitosdaniel.com</div>
</div>`;

const frontmatter = (slug) => {
	const src = readFileSync(join(root, `src/pages/work/${slug}.mdx`), "utf8");
	const fm = src.split("---")[1];
	const get = (k) => fm.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, "m"))?.[1] ?? "";
	const stack = [...fm.matchAll(/^\s+-\s+(.*)$/gm)].map((m) => m[1]);
	return { title: get("title"), timeline: get("timeline"), stack };
};

mkdirSync(join(root, "public/og"), { recursive: true });
shot(
	card({
		kicker: "Backend &amp; AI Engineer",
		title: "Production RAG and real-time systems.",
		sub: "Open to full-time roles · Cochabamba, Bolivia",
	}),
	join(root, "public/og/home.png"), 1200, 630,
);
for (const slug of ["formcore", "centinela", "poker", "rag-agent"]) {
	const { title, timeline, stack } = frontmatter(slug);
	shot(
		card({ kicker: `Case study · ${timeline}`, title: title.replace(/&/g, "&amp;"), sub: stack.slice(0, 5).join(" · ") }),
		join(root, `public/og/${slug}.png`), 1200, 630,
	);
}

// ---- Icons: "CD" monogram ---------------------------------------------------
// Square, solid, light-palette icons (iOS/Android round them and ignore dark mode).
const iconPng = (out, size, opts = {}) => shot(markSvg({ scheme: "light", size, radius: 0, ...opts }), out, size, size);
iconPng(join(root, "public/apple-touch-icon.png"), 180);
iconPng(join(root, "public/icon-192.png"), 192);
iconPng(join(root, "public/icon-512.png"), 512);
// Maskable: keep the mark inside the central 80% circle so Android's crop never clips it.
iconPng(join(root, "public/icon-512-maskable.png"), 512, { padding: 0.2 });

// Rounded small icons for the tab: favicon-48.png and the 16/32/48 images inside favicon.ico.
const sizes = [16, 32, 48];
const pngs = sizes.map((size) => {
	const out = join(tmp, `favicon-${size}.png`);
	shot(markSvg({ scheme: "light", size, radius: 14 }), out, size, size);
	return readFileSync(out);
});
writeFileSync(join(root, "public/favicon-48.png"), pngs[2]);

// favicon.ico: ICONDIR + one ICONDIRENTRY per image, PNG payloads.
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(1, 2); // type: icon
head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
sizes.forEach((size, i) => {
	const e = 6 + 16 * i;
	head.writeUInt8(size, e); head.writeUInt8(size, e + 1);
	head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
	head.writeUInt32LE(pngs[i].length, e + 8); head.writeUInt32LE(offset, e + 12);
	offset += pngs[i].length;
});
writeFileSync(join(root, "public/favicon.ico"), Buffer.concat([head, ...pngs]));

console.log("Generated og images, app icons and favicon.ico");
