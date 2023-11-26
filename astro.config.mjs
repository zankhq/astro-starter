import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import alpinejs from "@astrojs/alpinejs";
import AstroPWA from "@vite-pwa/astro";
import { i18n, filterSitemapByDefaultLocale } from "astro-i18n-aut/integration";
import { DEFAULT_LOCALE, LOCALES, SITE_URL } from "./src/consts";

const defaultLocale = DEFAULT_LOCALE;
const locales = LOCALES;

const prodEnv = import.meta.env.PROD;

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	trailingSlash: "always",
	build: {
		format: "directory",
	},
	vite: {
		logLevel: "error",
		define: {
			__DATE__: `'${new Date()}'`,
		},
	},
	integrations: [
		mdx(),
		sitemap({
			i18n: {
				locales,
				defaultLocale,
			},
			filter: filterSitemapByDefaultLocale({
				defaultLocale,
			}),
		}),
		tailwind(),
		alpinejs(),
		i18n({
			locales,
			defaultLocale,
			exclude: ["pages/api/**/*", "pages/rss.xml.ts", "pages/[locale]/rss.xml.ts"],
		}),
		// Disable sw until figure out the problems
		// AstroPWA({
		// 	mode: prodEnv ? "production" : "development",
		// 	base: "/",
		// 	scope: "/",
		// 	includeAssets: ["favicon.svg"],
		// 	registerType: "autoUpdate",
		// 	manifest: {
		// 		name: "Astro starter",
		// 		short_name: "Astro starter",
		// 		theme_color: "#ffffff",
		// 		icons: [
		// 			{
		// 				src: "pwa-192x192.png",
		// 				sizes: "192x192",
		// 				type: "image/png",
		// 			},
		// 			{
		// 				src: "pwa-512x512.png",
		// 				sizes: "512x512",
		// 				type: "image/png",
		// 			},
		// 			{
		// 				src: "pwa-512x512.png",
		// 				sizes: "512x512",
		// 				type: "image/png",
		// 				purpose: "any maskable",
		// 			},
		// 		],
		// 	},
		// 	workbox: {
		// 		navigateFallback: "/",
		// 		globPatterns: ["**/*.{css,js,html,svg,png,ico,txt}"],
		// 	},
		// 	devOptions: {
		// 		enabled: true,
		// 		suppressWarnings: true,
		// 		navigateFallbackAllowlist: [/^\//],
		// 	},
		// 	experimental: {
		// 		directoryAndTrailingSlashHandler: true,
		// 	},
		// }),
	],
});
