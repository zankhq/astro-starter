/**
 * From https://github.com/trktml/lotusforafrica/blob/main/src/utils/translationTools.ts
 */

import { getLocale } from "astro-i18n-aut";
import { DEFAULT_LOCALE, LOCALES } from "@src/consts";

import it from "@locales/it.json";
import en from "@locales/en.json";

const handler = {
	get(target: any, prop: any, receiver: any) {
		return target[prop].replaceAll("\n", "<br/>");
	},
};

const it_proxy = new Proxy(it, handler);
const en_proxy = new Proxy(en, handler);

export const defaultLocale = DEFAULT_LOCALE;
export const locales = LOCALES;

/**
 * Return the locale object with all the translations for a specific locale
 * @param astroUrl
 * @returns
 */
export default function t(astroUrl: URL): Locales {
	let locale = getLocale(astroUrl);

	switch (locale) {
		case "it":
			return it_proxy as Locales;
		default:
			return en_proxy as Locales;
	}
}

/**
 *
 * @param link Localize a specific path
 * @param astroUrl
 * @returns
 */
export function localizePath(link: string | URL, astroUrl: string | URL): string {
	let locale = getLocale(astroUrl);
	let localizedLink: string = "";
	if (locale && locale !== defaultLocale) {
		let localeLink = `/${getLocale(astroUrl) ?? ""}/${link}`.replaceAll("//", "/") ?? "";
		localizedLink = localeLink;
	} else {
		localizedLink = String(link);
	}

	// localizedLink add last slash
	if (!localizedLink.endsWith("/")) {
		localizedLink += "/";
	}

	return localizedLink;
}
