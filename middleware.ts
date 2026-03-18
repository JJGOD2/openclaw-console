// middleware.ts (at project root)
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",   // /dashboard (zh-TW default), /en/dashboard (English)
});

export const config = {
  // Match all paths except API, static files, and _next
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
