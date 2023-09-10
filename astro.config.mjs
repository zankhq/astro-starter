import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import astroI18next from "astro-i18next";
import alpinejs from "@astrojs/alpinejs";
import NetlifyCMS from "astro-netlify-cms";

// https://astro.build/config
export default defineConfig({
	site: "https://example.com",
	integrations: [
		mdx(),
		sitemap(),
		tailwind(),
		alpinejs(),
		astroI18next(),
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
