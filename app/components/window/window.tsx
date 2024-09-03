import Image from "next/image";
import styles from "./window.module.scss";
import { ReactElement } from "react";

type ActionProps = {
  name: string;
  action: () => void;
  disabled?: boolean;
};

type WindowProps = {
  title: string;
  icon?: string;
  gridArea?: string;
  actions?: ActionProps[];
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

function Action({ name, action, disabled }: ActionProps): ReactElement {
  return (
    <span
      onClick={action}
      className={styles.action}
      style={{
        pointerEvents: disabled ? "none" : "auto",
        color: disabled ? "gray" : "",
        cursor: disabled ? "auto" : "pointer",
      }}
    >
      <u>{name.substring(0, 1)}</u>
      {name.substring(1)}
    </span>
  );
}

export default function Window({
  title,
  icon,
  actions,
  gridArea,
  children,
}: WindowProps) {
  const actionEls: ReactElement[] = [];

  actions?.forEach(({ name, action, disabled }: ActionProps) => {
    actionEls.push(
      <Action key={name} name={name} action={action} disabled={disabled} />
    );
  });
  return (
    <div
      className={styles.outerWindow}
      style={{ gridArea: gridArea ?? title.toLowerCase() }}
    >
      <div className={styles.innerWindow}>
        <div className={styles.titleBar}>
          <div className={styles.title}>
            <Image
              src={`/esolangs/icons/${icon ?? "window-icon.png"}`}
              alt="window icon"
              width={32}
              height={32}
            />
            <p>{title}</p>
          </div>
          <TitleBarButtons />
        </div>
        <div className={styles.actions}>{actionEls}</div>
        <div className={styles.outerContent}>
          <div className={styles.innerContent}>{children}</div>
        </div>
      </div>
    </div>
  );
}
