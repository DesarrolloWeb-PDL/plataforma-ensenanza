import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import styles from "./page.module.css";

export default async function Home({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const features = [
    { icon: "📚", title: t("featureLessons"), desc: t("featureLessonsDesc"), color: "#8b5cf6" },
    { icon: "📈", title: t("featureProgress"), desc: t("featureProgressDesc"), color: "#ec4899" },
    { icon: "📝", title: t("featureAssignments"), desc: t("featureAssignmentsDesc"), color: "#f97316" },
    { icon: "🎥", title: t("featureLive"), desc: t("featureLiveDesc"), color: "#06b6d4" },
    { icon: "🖨️", title: t("featureWorksheets"), desc: t("featureWorksheetsDesc"), color: "#10b981" },
    { icon: "🏆", title: t("featureGamification"), desc: t("featureGamificationDesc"), color: "#facc15" },
  ];

  const steps = [
    { title: t("step1"), desc: t("step1Desc"), color: "#7c3aed" },
    { title: t("step2"), desc: t("step2Desc"), color: "#ec4899" },
    { title: t("step3"), desc: t("step3Desc"), color: "#f97316" },
  ];

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logo}>
            <span className={styles.logoSquares}>
              <span className={styles.sq1} />
              <span className={styles.sq2} />
              <span className={styles.sq3} />
              <span className={styles.sq4} />
            </span>
            <span className={styles.logoText}>PDL</span>
          </div>
          <h1 className={styles.heroTitle}>{t("title")}</h1>
          <p className={styles.heroSubtitle}>{t("subtitle")}</p>
          <div className={styles.heroButtons}>
            <Link href="/auth" className={styles.btnPrimary}>{t("ctaStart")}</Link>
            <Link href="/tracks" className={styles.btnSecondary}>{t("ctaTracks")}</Link>
          </div>
        </div>
        <div className={styles.heroImageWrap}>
          <Image
            src="/hero-landing.png"
            alt="Niños y adolescentes aprendiendo a programar"
            width={820}
            height={460}
            className={styles.heroImage}
            priority
          />
        </div>
      </section>

      {/* Tracks */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("tracksTitle")}</h2>
        <p className={styles.sectionSubtitle}>{t("tracksSubtitle")}</p>
        <div className={styles.tracksGrid}>
          <div className={styles.trackCard + " " + styles.trackBloques}>
            <span className={styles.trackAge}>{t("bloquesAge")}</span>
            <h3 className={styles.trackTitle}>{t("bloquesTitle")}</h3>
            <p className={styles.trackDesc}>{t("bloquesDesc")}</p>
            <Link href="/tracks" className={styles.trackLink}>Explorar →</Link>
          </div>
          <div className={styles.trackCard + " " + styles.trackHtml}>
            <span className={styles.trackAge}>{t("htmlAge")}</span>
            <h3 className={styles.trackTitle}>{t("htmlTitle")}</h3>
            <p className={styles.trackDesc}>{t("htmlDesc")}</p>
            <Link href="/tracks" className={styles.trackLink}>Explorar →</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("featuresTitle")}</h2>
        <div className={styles.featuresGrid}>
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard} style={{ borderTopColor: f.color }}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("howTitle")}</h2>
        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div key={s.title} className={styles.stepCard}>
              <div className={styles.stepNumber} style={{ background: s.color }}>{i + 1}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <h2 className={styles.finalCtaTitle}>{t("finalCtaTitle")}</h2>
        <p className={styles.finalCtaSubtitle}>{t("finalCtaSubtitle")}</p>
        <Link href="/auth" className={styles.btnPrimary}>{t("finalCta")}</Link>
      </section>

    </div>
  );
}