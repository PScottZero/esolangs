"use client";

import { useEffect, useRef, useState } from "react";

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

export default function Piet() {
  const [running, setRunning] = useState(false);
  const [cliMode, setCliMode] = useState(true);

  const programRef = useRef<HTMLTextAreaElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);
  const whitespaceRef = useRef(new WhitespaceInterpreter(setRunning));

  const getProgram = (): string => programRef.current!.value;
  const setProgram = (program: string) => {
    programRef.current!.value = program;
    highlightCmdChars();
  };

  const highlightCmdChars = () => {
    const program = getProgram();

    highlightsRef.current!.innerHTML = "";
    for (const ch of program) {
      const span = document.createElement("span");

      if (ch === " ") {
        span.innerHTML = "&nbsp;";
        span.style.background = "blue";
      } else if (ch === "\t") {
        span.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
        span.style.background = "orange";
      } else if (ch === "\n") {
        span.style.background = "transparent";
        span.innerHTML = "<br>";
      } else {
        span.style.background = "transparent";
        span.innerHTML = ch;
      }
      highlightsRef.current!.appendChild(span);
    }

    // programRef.current!.value = programRef
    //   .current!.value.replaceAll("\t", "[T]")
    //   .replaceAll("\n", "[N]\n")
    //   .replaceAll(" ", " ");
  };

  const keydownListener = (e: KeyboardEvent) => {
    e.preventDefault();
    console.log(e.key);
    switch (e.key) {
      case "Tab":
        programRef.current!.value += "\t";
        break;
      case " ":
        programRef.current!.value += " ";
        break;
      case "Enter":
        programRef.current!.value += "\n";
        break;
      case "Backspace":
        programRef.current!.value = programRef.current!.value.substring(
          0,
          programRef.current!.value.length - 1,
        );
        break;
    }
    highlightCmdChars();
  };

  useEffect(() => {
    readTextFileFromServer(programsJson.whitespace.default, (result) => {
      setProgram(result);
      whitespaceRef.current.run(result, cliMode);
    });
    programRef.current!.addEventListener("keydown", keydownListener);
    return () => {
      programRef.current!.removeEventListener("keydown", keydownListener);
    };
  }, []);

  return (
    <main className={styles.main}>
      <Window
        title="Whitespace Editor"
        icon="editor.png"
        gridArea="editor"
        actions={[
          newAction("Run", () =>
            whitespaceRef.current.run(getProgram(), cliMode),
          ),
          newAction("Stop", () => whitespaceRef.current.stop(), !running),
          newAction("Load", () => whitespaceRef.current.load()),
          newAction("Save", () => saveTextFile("program.ws", getProgram())),
        ]}
      >
        <div className={styles.programContainer}>
          <div ref={highlightsRef} className={styles.highlights} />
          <textarea
            ref={programRef}
            className={styles.textArea}
            name="editor"
          />
        </div>
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
