"use client";

import { useEffect, useRef, useState } from "react";
import React from "react";

import programsJson from "../../public/programs.json";
import { newAction } from "../.components/action/action";
import Programs from "../.components/programs/programs";
import Window from "../.components/window/window";
import {
  readTextFileFromLocal,
  readTextFileFromServer,
  saveTextFile,
} from "../requests";
import { BrainfuckInterpreter } from "./interpreter";
import styles from "./page.module.scss";

function inputValid(io: string, prevIO: string): boolean {
  if (io.length <= prevIO.length) return false;
  for (let i = 0; i < prevIO.length; i++) {
    if (io.at(i) !== prevIO.at(i)) return false;
  }
  return true;
}

export default function Brainfuck() {
  const [running, setRunning] = useState<boolean>(false);
  const [cliMode, setCliMode] = useState<boolean>(true);

  const loadRef = useRef<HTMLInputElement>(null);
  const progRef = useRef<HTMLTextAreaElement>(null);
  const ioRef = useRef<HTMLTextAreaElement>(null);
  const prevIORef = useRef<string>("");
  const bfRef = useRef<BrainfuckInterpreter>(
    new BrainfuckInterpreter(ioRef, prevIORef, setRunning),
  );

  const getProgram = (): string => progRef.current!.value;
  const setProgram = (program: string) => (progRef.current!.value = program);

  const setInput = () => {
    if (bfRef.current.running) {
      let io = ioRef.current!.value;
      let prevIO = prevIORef.current;
      if (!inputValid(io, prevIO)) {
        io = prevIORef.current;
        ioRef.current!.value = io;
      } else if (io.endsWith("\n")) {
        const input = io.substring(prevIO.length);
        prevIORef.current = io;
        bfRef.current.setInput(input);
        console.log(`accepted input: ${input}`);
      }
    }
  };

  useEffect(() => {
    readTextFileFromServer(programsJson.brainfuck.default, (result) => {
      setProgram(result);
      bfRef.current.run(result, cliMode);
    });
  }, []);

  return (
    <main className={styles.main}>
      <Window
        title="Brainfuck Editor"
        icon="editor.png"
        gridArea="editor"
        actions={[
          newAction("Run", () => bfRef.current.run(getProgram(), cliMode)),
          newAction("Stop", () => bfRef.current.stop(), !running),
          newAction("Load", () => loadRef.current!.click()),
          newAction("Save", () => saveTextFile("program.b", getProgram())),
        ]}
      >
        <textarea ref={progRef} className={styles.textArea} name="editor" />
      </Window>
      <Programs
        programs={programsJson.brainfuck.programs}
        onClick={(program) =>
          readTextFileFromServer(
            `${programsJson.brainfuck.path}/${program}`,
            setProgram,
          )
        }
      />
      <Window
        title="Terminal"
        icon="ms-dos.png"
        gridArea="terminal"
        actions={[
          newAction(
            `Mode: ${cliMode ? "CLI" : "In/Out"}`,
            () => setCliMode(!cliMode),
            running,
          ),
        ]}
      >
        <textarea
          ref={ioRef}
          className="terminal"
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
        onChange={(e) => readTextFileFromLocal(e, setProgram)}
      />
    </main>
  );
}
