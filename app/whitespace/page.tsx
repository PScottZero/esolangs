"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";

import programsJson from "../../public/programs.json";
import { newAction } from "../.components/action/action";
import Programs from "../.components/programs/programs";
import Window from "../.components/window/window";
import {
  readTextFileFromLocal,
  readTextFileFromServer,
  saveTextFile,
} from "../requests";
import { WhitespaceInterpreter } from "./interpreter";
import styles from "./page.module.scss";

const KEY_TO_CHAR = new Map([
  [" ", " "],
  ["Tab", "\t"],
  ["Enter", "\n"],
  ["Backspace", "<"],
]);

export default function Whitespace() {
  const [running, setRunning] = useState(false);
  const [cliMode, setCliMode] = useState(true);

  const programRef = useRef<HTMLTextAreaElement>(null);
  const whitespaceRef = useRef(new WhitespaceInterpreter(setRunning));

  const getProgram = (): string => programRef.current!.value;

  const setProgram = (program: string) => {
    programRef.current!.value = "";
    for (const ch of program) {
      programRef.current!.value += ch === " " ? "█" : ch === "\t" ? "▒" : ch;
    }
  };

  const runProgram = () => {
    let program = "";
    for (const ch of getProgram()) {
      program += ch === "█" ? " " : ch === "▒" ? "\t" : ch;
    }
    whitespaceRef.current.run(program, cliMode);
  };

  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    const textArea = programRef.current!;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;

    const program = getProgram();
    const programStart = program.substring(0, start);
    const programEnd = program.substring(end);

    const ch = KEY_TO_CHAR.get(e.key) ?? "";
    if (ch === "<") {
      if (start === end) {
        setProgram(programStart.substring(0, start - 1) + programEnd);
        textArea.selectionEnd = start - 1;
      } else {
        setProgram(programStart + programEnd);
        textArea.selectionEnd = start;
      }
    } else if (ch !== "") {
      setProgram(programStart + ch + programEnd);
      textArea.selectionEnd = start + 1;
    }
  };

  useEffect(() => {
    readTextFileFromServer(programsJson.whitespace.default, (result) => {
      setProgram(result);
      runProgram();
    });
  }, []);

  return (
    <main className={styles.main}>
      <Window
        title="Whitespace Editor"
        icon="editor.png"
        gridArea="editor"
        actions={[
          newAction("Run", runProgram),
          newAction("Stop", () => whitespaceRef.current.stop(), !running),
          newAction("Load", () => whitespaceRef.current.load()),
          newAction("Save", () => saveTextFile("program.ws", getProgram())),
        ]}
      >
        <textarea name="editor" ref={programRef} onKeyDown={keyDown} />
      </Window>
      <Programs
        programs={programsJson.whitespace.programs}
        onClick={(program) =>
          readTextFileFromServer(
            `${programsJson.whitespace.path}/${program}`,
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
          ref={(el) => whitespaceRef.current.setIoEl(el!)}
          className="terminal"
          name="terminal"
          onChange={() => whitespaceRef.current.setInput()}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </Window>
      <input
        ref={(el) => whitespaceRef.current.setLoadEl(el!)}
        type="file"
        accept=".ws"
        style={{ display: "none" }}
        onChange={(e) => readTextFileFromLocal(e, setProgram)}
      />
    </main>
  );
}
