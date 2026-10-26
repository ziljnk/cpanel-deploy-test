import { cacheLife } from "next/cache";
import type { CSSProperties } from "react";
import { getAppMode, isTestMode } from "@/lib/app-mode";
import { commitId } from "@/lib/commit";
import { getHomeCopy } from "@/lib/db";
import styles from "./page.module.css";

export const metadata = {
  title: "Deploy OK",
};

export default async function Home() {
  const siteCopyText = await loadHomeCopy();
  const commit = commitId();
  const shortCommit = commit === "unknown" ? commit : commit.slice(0, 7);
  const mode = getAppMode();
  const colors = colorsFromCommit(commit);
  const buildTime = process.env.BUILD_TIME || "unknown";

  return (
    <main
      className={styles.page}
      style={
        {
          "--page-bg": colors.background,
          "--page-panel": colors.panel,
          "--page-accent": colors.accent,
        } as CSSProperties
      }
    >
      <section className={styles.panel}>
        <p className={styles.kicker}>cPanel deploy rehearsal</p>
        <h1 className={styles.heading}>Deploy OK, pushed by Linh</h1>
        <p className={styles.sha}>{shortCommit}</p>
        <p className={styles.full}>{commit}</p>
        <dl className={styles.meta}>
          <div className={styles.row}>
            <dt className={styles.label}>Build time</dt>
            <dd className={styles.value}>{buildTime}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.label}>APP_MODE</dt>
            <dd className={styles.value}>
              {mode}
              {isTestMode() ? <span className={styles.badge}>TEST</span> : null}
            </dd>
          </div>
        </dl>
        <p id="site-copy" className={styles.copy}>
          {siteCopyText}
        </p>
        <a className={styles.link} href="/api/health">
          /api/health
        </a>
      </section>
    </main>
  );
}

async function loadHomeCopy() {
  "use cache";
  cacheLife({ revalidate: 3600, expire: 86400 });
  if (!process.env.DATABASE_URL) return "Database not configured.";
  const value = await getHomeCopy();
  return value || "No home row in site_copy.";
}

function colorsFromCommit(commit: string) {
  let hash = 2166136261;
  for (let i = 0; i < commit.length; i++) {
    hash ^= commit.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hue = (hash >>> 0) % 360;
  return {
    background: `hsl(${hue} 42% 14%)`,
    panel: `hsl(${hue} 32% 10%)`,
    accent: `hsl(${hue} 85% 64%)`,
  };
}
