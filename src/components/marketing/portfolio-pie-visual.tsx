import Image, { type StaticImageData } from "next/image";
import styles from "./marketing.module.css";

export function PortfolioPieVisual({
  asset = "/brand/portfolio-pie.webp",
}: {
  asset?: string | StaticImageData;
} = {}) {
  return (
    <div className={styles.portfolioPie} aria-hidden="true" data-asset-state="ready">
      <Image
        src={asset}
        alt=""
        fill
        sizes="(max-width: 767px) 260px, (max-width: 1100px) 340px, 410px"
        preload
        className={styles.pieImage}
      />
      <div className={`${styles.pieAnnotation} ${styles.pieAnnotationLeft}`}>
        <div className={styles.annotationTextWrapper}>
          <span className={styles.annotationText}>A smarter<br />you</span>
          <svg className={styles.sparkleDoodle} width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path d="M3 10L7 2M9 10L13 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <svg className={styles.arrowLeft} width="44" height="34" viewBox="0 0 44 34" fill="none" aria-hidden="true">
          <path d="M6 4C10 18 22 26 36 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M28 20L37 24L31 29" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={`${styles.pieAnnotation} ${styles.pieAnnotationRight}`}>
        <span className={styles.annotationText}>A brighter<br />tomorrow</span>
        <svg className={styles.arrowRight} width="44" height="34" viewBox="0 0 44 34" fill="none" aria-hidden="true">
          <path d="M38 4C34 18 22 26 8 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16 20L7 24L13 29" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
