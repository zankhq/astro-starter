import { sequence } from "astro/middleware";
import { i18nMiddleware } from "astro-i18n-aut";

/**
 * onRequest middleware function that adds i18n middleware to the request sequence.
 * @function
 * @returns {Function} - The sequence function with i18n middleware added.
 */
export const onRequest = sequence(i18nMiddleware);
