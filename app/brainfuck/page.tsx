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
  const ioRef = useRef<HTMLTextAreaElement>(null);
  const prevIORef = useRef<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const interpreter = useRef<BrainfuckInterpreter>(
    new BrainfuckInterpreter(ioRef, prevIORef, setRunning)
  );

  const run = async () => {
    await interpreter.current.run(progRef.current!.value);
  };

  const stop = async () => {
    await interpreter.current.stop();
  };

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
    let io = ioRef.current!.value;
    let prevIO = prevIORef.current;
    if (io.length <= prevIO.length) {
      io = prevIORef.current;
      ioRef.current!.value = io;
    } else if (io.endsWith("\n")) {
      const input = io.substring(prevIO.length);
      console.log(input);
      prevIORef.current = io;
      interpreter.current.setInput(input);
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
        icon="editor.png"
        gridArea="editor"
        actions={
          new Map([
            ["Run", [run, false]],
            ["Stop", [stop, !running]],
            ["Load", [chooseFile, false]],
            ["Save", [save, false]],
          ])
        }
      >
        <textarea ref={progRef} className={styles.textArea} name="editor" />
      </Window>
      <Window title="Terminal" icon="terminal.png" gridArea="terminal">
        <textarea
          ref={ioRef}
          className={styles.textArea}
          name="terminal"
          onChange={setInput}
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
