import i18next from "i18next";
import { getBlogPath } from "@scripts/blogUtils.js";
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "@src/consts";

export async function GET(context: { site: any }) {
	const posts = await getCollection("blog");

	var processedPosts = posts.map((post) => {
		const [...slug] = post.slug.split("/");
		let lang = i18next.language;
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

	const localizedPosts = processedPosts.filter((post) => post.lang === (i18next.language || "en"));

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: localizedPosts.map((post) => ({
			...post.data,
			link: getBlogPath(post.slug),
		})),
	});
}
