import Image from "next/image";
import { ReactElement } from "react";

import { Action, ActionProps } from "../action/action";
import Button from "../button/button";
import styles from "./window.module.scss";

const WINDOW_BUTTON_ICONS = ["minimize", "maximize", "close"];

type WindowProps = {
  title: string;
  icon?: string;
  gridArea?: string;
  actions?: ActionProps[];
  sidebar?: ReactElement;
  children?: React.ReactNode;
};

export default function Window({
  title,
  icon,
  gridArea,
  actions,
  sidebar,
  children,
}: WindowProps) {
  const actionEls: ReactElement[] = [];

  actions?.forEach(({ name, action, disabled }: ActionProps) => {
    actionEls.push(
      <Action key={name} name={name} action={action} disabled={disabled} />,
    );
  });

  const titleBarButtons = [];
  for (const icon of WINDOW_BUTTON_ICONS) {
    titleBarButtons.push(
      <Button key={icon} width="1.6rem" height="1.5rem">
        <Image
          className={styles.buttonImage}
          src={`/esolangs/icons/${icon}.png`}
          alt={icon}
          width={32}
          height={32}
        />
      </Button>,
    );
  }

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
          <span className={styles.titleBarButtons}>{titleBarButtons}</span>
        </div>
        <div className={styles.actions}>{actionEls}</div>
        <div className={styles.sidebar}>{sidebar}</div>
        <div className={styles.outerContent}>
          <div className={styles.innerContent}>{children}</div>
        </div>
      </div>
    </div>
  );
}
