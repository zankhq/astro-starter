/**
 * From https://github.com/trktml/lotusforafrica/blob/main/src/utils/translationTools.ts
 */

import { DEFAULT_LOCALE, LOCALES } from "@src/consts";
import { getLocale } from "astro-i18n-aut";

import en from "@locales/en.json";
import it from "@locales/it.json";

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
	const locale = getLocale(astroUrl);

	switch (locale) {
		case "it":
			return it_proxy as Locales;
		default:
			return en_proxy as Locales;
	}
}

export function tFn(astroUrl: URL) {
	const locale = getLocale(astroUrl);
	let translations: any;

	switch (locale) {
		case "it":
			translations = it_proxy;
			break;
		default:
			translations = en_proxy;
			break;
	}

	return (key: string): string => {
		if (key in translations) {
			return translations[key];
		}
		console.warn(`Missing translation key: ${key}`);
		return key;
	};
}

/**
 *
 * @param link Localize a specific path
 * @param astroUrl
 * @returns
 */
export function localizePath(
	link: string | URL,
	astroUrl: string | URL,
): string {
	const locale = getLocale(astroUrl);
	let localizedLink = "";
	if (locale && locale !== defaultLocale) {
		const localeLink =
			`/${getLocale(astroUrl) ?? ""}/${link}`.replaceAll("//", "/") ?? "";
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
