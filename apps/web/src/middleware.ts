import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["es"],
  defaultLocale: "es",
  localePrefix: "as-needed",
});

export const config = {
  matcher: ["/((?!api|_next|health|.*\\..*).*)"],
};