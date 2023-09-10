import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import alpinejs from "@astrojs/alpinejs";
import NetlifyCMS from "astro-netlify-cms";
import { i18n, filterSitemapByDefaultLocale } from "astro-i18n-aut/integration";
import { DEFAULT_LOCALE, LOCALES, SITE_URL } from "./src/consts";

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
			filter: filterSitemapByDefaultLocale({ defaultLocale }),
		}),
		tailwind(),
		alpinejs(),
		i18n({
			locales,
			defaultLocale,
		}),
		NetlifyCMS({
			config: {
				local_backend: true,
				backend: {
					name: "git-gateway",
					branch: "main",
				},
				media_folder: "public/images",
				public_folder: "/images",
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
