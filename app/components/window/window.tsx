import Image from "next/image";
import styles from "./window.module.scss";

type WindowProps = {
  title: string;
  gridArea?: string;
  children?: React.ReactNode;
};

export default function Window({ title, gridArea, children }: WindowProps) {
  return (
    <div
      className={styles.outerWindow}
      style={{ gridArea: gridArea ?? title.toLowerCase() }}
    >
      <div className={styles.innerWindow}>
        <div className={styles.titleBar}>
          <div className={styles.title}>
            <Image
              src="/program_manager-1.png"
              alt="window icon"
              width={32}
              height={32}
            />
            <p>{title}</p>
          </div>
          <span className={styles.titleBarButtons}>
            <div className={styles.titleBarButton}>
              <Image
                src="/minimize.png"
                alt="minimize"
                width={32}
                height={32}
              />
            </div>
            <div className={styles.titleBarButton}>
              <Image
                src="/maximize.png"
                alt="maximize"
                width={32}
                height={32}
              />
            </div>
            <div className={styles.titleBarButton}>
              <Image src="/close.png" alt="close" width={32} height={28} />
            </div>
          </span>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
