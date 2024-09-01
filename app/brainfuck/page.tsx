"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Window from "./../components/window/window";
import styles from "./page.module.scss";
import { BrainfuckInterpreter } from "./interpreter";
import React from "react";

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
  const loadRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLAnchorElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const [program, setProgram] = useState<string>(DEFAULT_PROG);
  const [input, setInput] = useState<string>(DEFAULT_INPUT);
  const [output, setOutput] = useState<string>("");

  const _setOutput = (output: string) => {
    setOutput(output);
    outputRef.current!.scrollTop = outputRef.current!.scrollHeight;
  };

  const [interpreter, setInterpreter] = useState<BrainfuckInterpreter>(
    new BrainfuckInterpreter(_setOutput)
  );

  const run = async () => {
    console.log("Running");
    interpreter.running = false;
    await new Promise((resolve) => setTimeout(resolve, 50));
    interpreter.load(program.trim(), input.trim());
    interpreter.run();
    setInterpreter(interpreter);
    setOutput("");
  };

  const terminate = () => {
    interpreter.running = false;
    setInterpreter(interpreter);
  };

  const chooseFile = () => {
    loadRef.current!.click();
  };

  const load = (e: ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onload = async () => {
      setProgram(reader.result as string);
    };
    reader.readAsText(e.target.files![0]);
  };

  const save = () => {
    const file = new Blob([program], { type: "text/plain" });
    saveRef.current!.href = URL.createObjectURL(file);
    saveRef.current!.download = "program.b";
    saveRef.current!.click();
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
            ["Load", chooseFile],
            ["Save", save],
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
        />
      </Window>
      <Window title="Output">
        <textarea
          ref={outputRef}
          className={styles.textArea}
          name="output"
          value={output}
          readOnly={true}
        />
      </Window>
      <input
        ref={loadRef}
        type="file"
        accept=".b,.bf"
        style={{ display: "none" }}
        onChange={load}
      />
      <a ref={saveRef} style={{ display: "none" }} />
    </main>
  );
}
