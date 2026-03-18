// i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "./config";

export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  const validLocale = locales.includes(locale as typeof locales[number])
    ? locale
    : defaultLocale;

  return {
    locale:   validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
  };
});
