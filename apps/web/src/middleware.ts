import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["es", "en", "pt"],
  defaultLocale: "es",
  localePrefix: "as-needed",
  localeDetection: false,
});

export const config = {
  matcher: ["/((?!api|_next|health|.*\\..*).*)"],
};