import styles from "./button.module.scss";

type ButtonProps = {
  width?: string;
  height?: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

export default function Button({
  width,
  height,
  onClick,
  children,
}: ButtonProps) {
  return (
    <div
      className={styles.outerButton}
      onClick={onClick}
      style={{ width: width, height: height }}
    >
      <div className={styles.innerButton}>{children}</div>
    </div>
  );
}
