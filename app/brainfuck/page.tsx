"use client";

import { ChangeEvent, ReactElement, useEffect, useRef, useState } from "react";
import Window from "./../components/window/window";
import styles from "./page.module.scss";
import { BrainfuckInterpreter } from "./interpreter";
import React from "react";
import Image from "next/image";

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

const PROGRAMS = [
  "400quine.b",
  "bsort.b",
  "collatz.b",
  "dbf2c.b",
  "dbfi.b",
  "dquine.b",
  "dvorak.b",
  "e.b",
  "factorial2.b",
  "fib.b",
  "golden.b",
  "head.b",
  "impeccable.b",
  "isort.b",
  "jabh.b",
  "life.b",
  "numwarp.b",
  "qsort.b",
  "random.b",
  "rot13.b",
  "short.b",
  "sierpinski.b",
  "squares.b",
  "squares2.b",
  "thuemorse.b",
  "tictactoe.b",
  "utm.b",
  "wc.b",
  "xmastree.b",
];

function inputValid(io: string, prevIO: string): boolean {
  if (io.length <= prevIO.length) return false;
  for (let i = 0; i < prevIO.length; i++) {
    if (io.at(i) !== prevIO.at(i)) return false;
  }
  return true;
}

export default function Brainfuck() {
  const loadRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLAnchorElement>(null);
  const progRef = useRef<HTMLTextAreaElement>(null);
  const ioRef = useRef<HTMLTextAreaElement>(null);
  const prevIORef = useRef<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [cliMode, setCliMode] = useState<boolean>(true);
  const interpreter = useRef<BrainfuckInterpreter>(
    new BrainfuckInterpreter(ioRef, prevIORef, setRunning)
  );

  const run = async () => {
    await interpreter.current.run(progRef.current!.value, cliMode);
  };

  const stop = async () => await interpreter.current.stop();

  const load = () => loadRef.current!.click();

  const readProgramFromFileChooser = async (e: ChangeEvent<HTMLInputElement>) =>
    readProgram(e.target.files![0]);

  const readProgramFromServer = async (name: string) => {
    const res = await fetch(`/esolangs/bin/brainfuck/${name}`);
    if (res.ok) await readProgram(await res.blob());
  };

  const readProgram = async (file: Blob) => {
    const reader = new FileReader();
    reader.onload = async () => {
      progRef.current!.value = reader.result as string;
    };
    reader.readAsText(file);
  };

  const save = () => {
    const file = new Blob([progRef.current!.value], { type: "text/plain" });
    saveRef.current!.href = URL.createObjectURL(file);
    saveRef.current!.download = "program.b";
    saveRef.current!.click();
  };

  const setInput = () => {
    if (interpreter.current.running) {
      let io = ioRef.current!.value;
      let prevIO = prevIORef.current;
      if (!inputValid(io, prevIO)) {
        io = prevIORef.current;
        ioRef.current!.value = io;
      } else if (io.endsWith("\n")) {
        const input = io.substring(prevIO.length);
        prevIORef.current = io;
        interpreter.current.setInput(input);
        console.log(`accepted input: ${input}`);
      }
    }
  };

  const toggleCliMode = () => setCliMode(!cliMode);

  useEffect(() => {
    progRef.current!.value = DEFAULT_PROG;
    run();
  }, []);

  const programEls: ReactElement[] = [];
  for (const program of PROGRAMS) {
    programEls.push(
      <div
        key={program}
        className={styles.program}
        onClick={() => readProgramFromServer(program)}
      >
        <Image
          src="/esolangs/icons/program.png"
          alt="program"
          width={32}
          height={32}
        />
        <p>{program}</p>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      <Window
        title="Brainfuck Editor"
        icon="editor.png"
        gridArea="editor"
        actions={[
          { name: "Run", action: run },
          { name: "Stop", action: stop, disabled: !running },
          { name: "Load", action: load },
          { name: "Save", action: save },
        ]}
      >
        <textarea ref={progRef} className={styles.textArea} name="editor" />
      </Window>
      <Window title="Programs" icon="folder.png" gridArea="programs">
        <div className={styles.programs}>{programEls}</div>
      </Window>
      <Window
        title="Terminal"
        icon="ms-dos.png"
        gridArea="terminal"
        actions={[
          {
            name: cliMode ? "Mode: CLI" : "Mode: Input/Output",
            action: toggleCliMode,
            disabled: running,
          },
        ]}
      >
        <textarea
          ref={ioRef}
          className={styles.textArea + " " + styles.terminal}
          name="terminal"
          onChange={setInput}
          spellCheck={false}
        />
      </Window>
      <input
        ref={loadRef}
        type="file"
        accept=".b,.bf"
        style={{ display: "none" }}
        onChange={readProgramFromFileChooser}
      />
      <a ref={saveRef} style={{ display: "none" }} />
    </main>
  );
}
