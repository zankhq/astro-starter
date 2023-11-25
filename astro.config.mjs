import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import alpinejs from "@astrojs/alpinejs";
import { i18n, filterSitemapByDefaultLocale } from "astro-i18n-aut/integration";
import { DEFAULT_LOCALE, LOCALES, SITE_URL, HOSTING_SERVICE, REPO, DEFAULT_BRANCH } from "./src/consts";
import sveltiaCms from "astro-sveltia-cms";
import cloudflare from "@astrojs/cloudflare";
const defaultLocale = DEFAULT_LOCALE;
const locales = LOCALES;

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	trailingSlash: "always",
	build: {
		format: "directory",
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
		sveltiaCms(),
	],
	output: "server",
	adapter: cloudflare(),
});
