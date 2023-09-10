import { localizePath } from "astro-i18next";

export const getBlogPath = (slug) => {
	return localizePath(`/blog/${slug.split("/").slice(1).join("/")}/`);
};
