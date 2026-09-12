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
    </div>
  );
}
