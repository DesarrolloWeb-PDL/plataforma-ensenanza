import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

import "../globals.css";

import HeaderNav from "@/components/HeaderNav";
import PostHogProvider from "@/components/PostHogProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#facc15" />
      </head>
      <body>
        <PostHogProvider>
          <NextIntlClientProvider messages={messages}>
            <ServiceWorkerRegister />
            <header className="brutal-header">
              <div className="brutal-logo-wrap">
                <a href="/" className="brutal-logo">
                  <span className="brutal-squares">
                    <span style={{ background: "var(--brutal-yellow)" }} />
                    <span style={{ background: "var(--brutal-pink)" }} />
                    <span style={{ background: "var(--brutal-cyan)" }} />
                    <span style={{ background: "var(--brutal-green)" }} />
                  </span>
                  <span>PDL</span>
                </a>
                <div className="brutal-lang">
                  <a href="/">ES</a>
                  <a href="/en">EN</a>
                  <a href="/pt">PT</a>
                </div>
              </div>
              <HeaderNav />
            </header>
            <div className="brutal-main">{children}</div>
            <footer className="brutal-footer">
              © {new Date().getFullYear()} Plataforma de Enseñanza — DesarrolloWeb-PDL
            </footer>
          </NextIntlClientProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}