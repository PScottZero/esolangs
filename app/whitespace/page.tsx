"use client";

import Programs from "../.components/programs/programs";
import Window from "../.components/window/window";
import styles from "./page.module.scss";

export default function Piet() {
  return (
    <main className={styles.main}>
      <Window
        title="Whitespace Editor"
        icon="editor.png"
        gridArea="editor"
      ></Window>
      <Window title="Terminal" icon="ms-dos.png">
        <textarea
          className="terminal"
          name="terminal"
          onChange={() => {}}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </Window>
      <Programs programs={[]} programIcon="image.png" onClick={() => {}} />
    </main>
  );
}
