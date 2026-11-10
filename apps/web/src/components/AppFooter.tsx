"use client";

import { useTranslations } from "next-intl";

const COMPANY_URL = "https://desarrolloweb-pdl.dev";

function PdlLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect x="4" y="4" width="11" height="11" fill="currentColor" opacity="1" />
      <rect x="17" y="4" width="11" height="11" fill="currentColor" opacity="0.7" />
      <rect x="4" y="17" width="11" height="11" fill="currentColor" opacity="0.5" />
      <rect x="17" y="17" width="11" height="11" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export default function AppFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="brutal-footer">
      <div className="footer-brand-title">
        <span className="brutal-squares">
          <span style={{ background: "var(--brutal-yellow)" }} />
          <span style={{ background: "var(--brutal-pink)" }} />
          <span style={{ background: "var(--brutal-cyan)" }} />
          <span style={{ background: "var(--brutal-green)" }} />
        </span>
        <span>DesarrolloWeb Academy</span>
      </div>

      <div className="footer-bottom">
        <span className="footer-copy">
          © {new Date().getFullYear()} DesarrolloWeb Academy — {t("rights")}
        </span>
        <span className="footer-brand">
          <a href={COMPANY_URL} target="_blank" rel="noopener noreferrer">
            <PdlLogo size={18} />
            {t("brand")}
          </a>
        </span>
      </div>
    </footer>
  );
}