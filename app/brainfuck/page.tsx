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

export default function Brainfuck() {
  const [running, setRunning] = useState(false);
  const [cliMode, setCliMode] = useState(true);

  const programRef = useRef<HTMLTextAreaElement>(null);
  const bfRef = useRef(new BrainfuckInterpreter(setRunning));

  const getProgram = (): string => programRef.current!.value;
  const setProgram = (program: string) => (programRef.current!.value = program);

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
          newAction("Load", () => bfRef.current.load()),
          newAction("Save", () => saveTextFile("program.b", getProgram())),
        ]}
      >
        <textarea ref={programRef} className={styles.textArea} name="editor" />
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
        actions={[
          newAction(
            `Mode: ${cliMode ? "CLI" : "In/Out"}`,
            () => setCliMode(!cliMode),
            running,
          ),
        ]}
      >
        <textarea
          ref={(el) => bfRef.current.setIoEl(el!)}
          className="terminal"
          name="terminal"
          onChange={() => bfRef.current.setInput()}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </Window>
      <input
        ref={(el) => bfRef.current.setLoadEl(el!)}
        type="file"
        accept=".b,.bf"
        style={{ display: "none" }}
        onChange={(e) => readTextFileFromLocal(e, setProgram)}
      />
    </main>
  );
}
