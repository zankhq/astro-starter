import type { APIRoute } from "astro";
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION, DEFAULT_LOCALE } from "../consts";

/**
 * defaultLang RSS feed
 * Returns an RSS feed for the blog posts.
 * @param {Object} site - The site object.
 * @returns {Response} - The response object containing the RSS feed.
 */
export const get: APIRoute = async function get({ site }) {
	const posts = await getCollection("blog", (entry) => entry.slug.startsWith(DEFAULT_LOCALE));

	const { body } = await rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: site!.href,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.slug.replace(`${DEFAULT_LOCALE}/`, "")}/`,
		})),
	});

	return new Response(body, {
		status: 200,
		statusText: "OK",
	});
};
