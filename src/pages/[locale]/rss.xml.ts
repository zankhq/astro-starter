import type { APIRoute } from "astro";
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION, DEFAULT_LOCALE, LOCALES } from "../../consts";

// i18n RSS feed

export function getStaticPaths() {
	return Object.keys(LOCALES).map((locale) => ({ params: { locale } }));
}

export const get: APIRoute = async function get({ params, redirect, site }) {
	const locale = params.locale;

	if (!locale) {
		return new Response(null, {
			status: 400,
			statusText: "Bad Request",
		});
	}

	if (locale === DEFAULT_LOCALE) {
		return redirect("/rss.xml");
	}

	const posts = await getCollection("blog", (entry) => entry.slug.startsWith(locale));

	if (posts.length === 0) {
		return new Response(null, {
			status: 404,
			statusText: "Not Found",
		});
	}

	const { body } = await rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: site!.href,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.slug.replace(`${locale}/`, "")}/`,
		})),
	});

	return new Response(body, {
		status: 200,
		statusText: "OK",
	});
};
