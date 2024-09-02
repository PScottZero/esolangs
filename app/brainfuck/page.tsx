"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Window from "./../components/window/window";
import styles from "./page.module.scss";
import { BrainfuckInterpreter } from "./interpreter";
import React from "react";

const DEFAULT_PROG = `
[sierpinski.b -- display Sierpinski triangle
(c) 2016 Daniel B. Cristofani
http://brainfuck.org/]

++++++++[>+>++++<<-]>++>>+<[-[>>+<<-]+>>]>+[
    -<<<[
        ->[+[-]+>++>>>-<<]<[<]>>++++++[<<+++++>>-]+<<++.[-]<<
    ]>.>+[>>]>+
]

[Shows an ASCII representation of the Sierpinski triangle
(iteration 5).]
`.trim();

export default function Brainfuck() {
  const loadRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLAnchorElement>(null);
  const progRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevInputRef = useRef<string>("");
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const interpreter = useRef<BrainfuckInterpreter>(
    new BrainfuckInterpreter(outputRef)
  );

  const run = async () => {
    inputRef.current!.value = "";
    prevInputRef.current = "";
    await interpreter.current!.run(progRef.current!.value);
  };

  const stop = async () => await interpreter.current!.stop();

  const chooseFile = () => loadRef.current!.click();

  const load = (e: ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onload = async () => {
      progRef.current!.value = reader.result as string;
    };
    reader.readAsText(e.target.files![0]);
  };

  const save = () => {
    const file = new Blob([progRef.current!.value], { type: "text/plain" });
    saveRef.current!.href = URL.createObjectURL(file);
    saveRef.current!.download = "program.b";
    saveRef.current!.click();
  };

  const setInput = () => {
    let currInput = inputRef.current!.value;
    if (currInput.length <= prevInputRef.current.length) {
      currInput = prevInputRef.current;
      inputRef.current!.value = currInput;
    } else if (currInput.endsWith("\n")) {
      prevInputRef.current = currInput;
      interpreter.current.setInput(currInput);
    }
  };

  useEffect(() => {
    progRef.current!.value = DEFAULT_PROG;
    run();
  }, []);

  return (
    <main className={styles.main}>
      <Window
        title="Brainfuck Interpreter"
        actions={
          new Map([
            ["Run", run],
            ["Stop", stop],
            ["Load", chooseFile],
            ["Save", save],
          ])
        }
        gridArea="editor"
      >
        <textarea ref={progRef} className={styles.textArea} name="editor" />
      </Window>
      <Window title="Input">
        <textarea
          ref={inputRef}
          className={styles.textArea}
          name="input"
          onChange={setInput}
        />
      </Window>
      <Window title="Output">
        <textarea
          ref={outputRef}
          className={styles.textArea}
          name="output"
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
