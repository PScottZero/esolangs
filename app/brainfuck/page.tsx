"use client";

import { useEffect, useState } from "react";
import Window from "./../components/window/window";
import styles from "./page.module.scss";
import { BrainfuckInterpreter } from "./interpreter";

const DEFAULT_PROG = `
,
[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-
[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-
[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-
[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-
[>++++++++++++++<-
[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-
[>>+++++[<----->-]<<-
[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-
[>++++++++++++++<-
[>+<-[>+<-[>+<-[>+<-[>+<-
[>++++++++++++++<-
[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-
[>>+++++[<----->-]<<-
[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-[>+<-
[>++++++++++++++<-
[>+<-]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]
]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]>.[-]<,]

of course any function char f(char) can be made easily on the same principle

[Daniel B Cristofani (cristofdathevanetdotcom)
http://www.hevanet.com/cristofd/brainfuck/]
`.trim();

const DEFAULT_INPUT = "Uryyb Jbeyq!";

export default function Brainfuck() {
  const [program, setProgram] = useState<string>(DEFAULT_PROG);
  const [input, setInput] = useState<string>(DEFAULT_INPUT);
  const [output, setOutput] = useState<string>("");
  const [interpreter, setInterpreter] = useState<BrainfuckInterpreter>(
    new BrainfuckInterpreter(setOutput)
  );

  const run = () => {
    console.log("Running");
    setOutput("");
    interpreter.load(program.trim(), input.trim());
    interpreter.run();
  };

  const terminate = () => {
    interpreter.running = false;
    setInterpreter(interpreter);
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <main className={styles.main}>
      <Window
        title="Brainfuck Interpreter"
        actions={
          new Map([
            ["Load", () => {}],
            ["Save", () => {}],
            ["Run", run],
            ["Terminate", terminate],
          ])
        }
        gridArea="editor"
      >
        <textarea
          className={styles.textArea}
          name="editor"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
        />
      </Window>
      <Window title="Input">
        <textarea
          className={styles.textArea}
          name="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        ></textarea>
      </Window>
      <Window title="Output">
        <textarea
          className={styles.textArea}
          name="output"
          value={output}
          readOnly={true}
        />
      </Window>
    </main>
  );
}
