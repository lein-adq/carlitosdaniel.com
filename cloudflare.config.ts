import { defineConfig } from "cf/config";

// Static Astro site: `astro build` writes ./dist, deployed with `cf deploy ./dist`.
export default defineConfig({
	worker: {
		name: "carlitosdaniel-com",
		compatibilityDate: "2026-11-20",
		domains: ["carlitosdaniel.com"],
		assets: {
			htmlHandling: "auto-trailing-slash",
			notFoundHandling: "404-page",
		},
	},
});
