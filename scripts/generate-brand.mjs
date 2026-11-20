/**
 * Generates the social-share images (public/og/*.png), the PNG app icons and favicon.ico
 * using headless Chrome and the site's own self-hosted fonts.
 *
 *   node scripts/generate-brand.mjs
 *
 * Re-run after changing a case study's title/stack or the palette. Output is committed.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
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
const icon = (size, radius) => `
<div style="width:${size}px;height:${size}px;background:var(--ink);border-radius:${radius}px;display:grid;place-items:center">
  <span style="font-family:Newsreader;font-weight:500;font-size:${size * 0.5}px;letter-spacing:-.03em;color:var(--paper);line-height:1">CD</span>
</div>`;
shot(icon(180, 0), join(root, "public/apple-touch-icon.png"), 180, 180); // iOS rounds it itself
shot(icon(192, 0), join(root, "public/icon-192.png"), 192, 192);
shot(icon(512, 0), join(root, "public/icon-512.png"), 512, 512);
const ico48 = join(tmp, "favicon-48.png");
shot(icon(48, 10), ico48, 48, 48);
shot(icon(48, 10), join(root, "public/favicon-48.png"), 48, 48);

// favicon.ico (PNG payload inside an ICO container)
const png = readFileSync(ico48);
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
head.writeUInt8(48, 6); head.writeUInt8(48, 7); head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);
writeFileSync(join(root, "public/favicon.ico"), Buffer.concat([head, png]));

console.log("Generated og images, app icons and favicon.ico");
