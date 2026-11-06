import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

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
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body>
        <PostHogProvider>
          <NextIntlClientProvider messages={messages}>
            <ServiceWorkerRegister />
            {children}
          </NextIntlClientProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}