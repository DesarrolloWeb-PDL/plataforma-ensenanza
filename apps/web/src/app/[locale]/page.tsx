import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("home");
  return (
    <main>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
    </main>
  );
}