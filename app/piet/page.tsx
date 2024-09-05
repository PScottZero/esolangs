import Window from "../components/window/window";
import styles from "./page.module.scss";

export default function Piet() {
  return (
    <main className={styles.main}>
      <Window title="Piet Editor" icon="paint.png" gridArea="editor"></Window>
      <Window title="Terminal" icon="ms-dos.png"></Window>
      <Window title="Programs" icon="folder.png"></Window>
    </main>
  );
}
