import { ReactElement } from "react";

import styles from "./action.module.scss";

export type ActionProps = {
  name: string;
  action: () => void;
  disabled?: boolean;
};

export function newAction(
  name: string,
  action: () => void,
  disabled?: boolean,
): ActionProps {
  return { name: name, action: action, disabled: disabled };
}

export function Action({ name, action, disabled }: ActionProps): ReactElement {
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
