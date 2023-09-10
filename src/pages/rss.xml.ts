import { getLocale } from "astro-i18n-aut";
import { getBlogPath } from "@src/utils/blog.ts";
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL, DEFAULT_LOCALE } from "@src/consts";

const locale = getLocale(DEFAULT_LOCALE);

export async function GET(context: { site: any }) {
	const posts = await getCollection("blog");

	var processedPosts = posts.map((post) => {
		const [...slug] = post.slug.split("/");
		let lang = locale;
		var firstSlug = post.slug.match(/^([^\/]*)\//);
		if (firstSlug) {
			lang = firstSlug[1];
		}
		return {
			...post,
			slug: slug.join("/"),
			lang: lang,
		};
	});

	const localizedPosts = processedPosts.filter((post) => post.lang === locale);

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: localizedPosts.map((post) => ({
			...post.data,
			link: getBlogPath(SITE_URL, post.slug),
		})),
	});
}
