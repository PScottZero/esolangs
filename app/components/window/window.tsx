import Image from "next/image";
import styles from "./window.module.scss";
import { ReactElement } from "react";

type WindowProps = {
  title: string;
  gridArea?: string;
  children?: React.ReactNode;
};

function TitleBarButton({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): ReactElement {
  return (
    <div className={styles.outerButton}>
      <div className={styles.innerButton}>{children}</div>
    </div>
  );
}

function TitleBarButtons(): ReactElement {
  return (
    <span className={styles.titleBarButtons}>
      <TitleBarButton>
        <Image
          src="/esolangs/icons/minimize.png"
          alt="minimize"
          width={32}
          height={32}
        />
      </TitleBarButton>
      <TitleBarButton>
        <Image
          src="/esolangs/icons/maximize.png"
          alt="maximize"
          width={32}
          height={32}
        />
      </TitleBarButton>
      <TitleBarButton>
        <Image
          src="/esolangs/icons/close.png"
          alt="close"
          width={32}
          height={28}
        />
      </TitleBarButton>
    </span>
  );
}

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
              src="/esolangs/icons/window-icon.png"
              alt="window icon"
              width={32}
              height={32}
            />
            <p>{title}</p>
          </div>
          <TitleBarButtons />
        </div>
        <div className={styles.outerContent}>
          <div className={styles.innerContent}>{children}</div>
        </div>
      </div>
    </div>
  );
}
