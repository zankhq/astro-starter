import { localizePath } from "@utils/t";

export const getBlogPath = (url: URL | string, slug?: string) => {
	return localizePath(`/blog/${slug}/`, url);
};
