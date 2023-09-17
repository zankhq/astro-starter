import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import alpinejs from "@astrojs/alpinejs";
import NetlifyCMS from "astro-netlify-cms";
import { i18n, filterSitemapByDefaultLocale } from "astro-i18n-aut/integration";
import { DEFAULT_LOCALE, LOCALES, SITE_URL, HOSTING_SERVICE, REPO, DEFAULT_BRANCH } from "./src/consts";

const defaultLocale = DEFAULT_LOCALE;
const locales = LOCALES;

let netlifyCMSBackendConfig = {
	name: "github",
	repo: REPO,
	branch: DEFAULT_BRANCH,
	base_url: SITE_URL,
	auth_endpoint: "/api/auth",
};

if (HOSTING_SERVICE === "netlify") {
	netlifyCMSBackendConfig = {
		name: "git-gateway",
		repo: REPO,
		branch: DEFAULT_BRANCH,
		base_url: SITE_URL,
	};
}

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
			filter: filterSitemapByDefaultLocale({ defaultLocale }),
		}),
		tailwind(),
		alpinejs(),
		i18n({
			locales,
			defaultLocale,
			exclude: ["pages/api/**/*", "pages/rss.xml.ts", "pages/[locale]/rss.xml.ts"],
		}),
		NetlifyCMS({
			config: {
				local_backend: true,
				backend: netlifyCMSBackendConfig, // Change here if you don't use neither cloudflare pages nor netlify
				media_folder: "src/assets/images",
				public_folder: "@assets/images",
				i18n: {
					structure: "multiple_folders",
					locales: ["en", "it"],
					default_locale: "en",
				},
				collections: [
					{
						name: "posts",
						i18n: true,
						label: "Blog Posts",
						folder: "src/content/blog",
						create: true,
						delete: true,
						fields: [
							{
								name: "title",
								widget: "string",
								label: "Post Title",
								i18n: true,
							},
							{
								label: "Description",
								name: "description",
								widget: "string",
								i18n: true,
							},
							{
								label: "Publish Date",
								name: "pubDate",
								widget: "datetime",
								format: "YYYY-MM-DD HH:mm",
								i18n: "duplicate",
							},
							{
								label: "Image",
								name: "heroImage",
								widget: "image",
								i18n: "duplicate",
							},
							{
								name: "body",
								widget: "markdown",
								label: "Post Body",
								i18n: true,
							},
						],
					},
				],
			},
		}),
	],
});
