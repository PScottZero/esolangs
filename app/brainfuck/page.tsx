import Window from "./../components/window/window";
import styles from "./page.module.scss";

export default function Brainfuck() {
  return (
    <main className={styles.main}>
      <Window title="Brainfuck Interpreter" gridArea="editor"></Window>
      <Window title="Input"></Window>
      <Window title="Output"></Window>
    </main>
  );
}
