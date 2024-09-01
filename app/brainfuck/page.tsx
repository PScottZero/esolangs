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
  const progRef = useRef<HTMLTextAreaElement>(null);
  const dataRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const interpreter = useRef<BrainfuckInterpreter>(
    new BrainfuckInterpreter(outputRef)
  );

  const run = async () => {
    await interpreter.current!.stop();
    interpreter.current!.load(
      progRef.current!.value.trim(),
      inputRef.current!.value.trim()
    );
    console.log("Running");
    interpreter.current!.run();
  };

  const stop = async () => {
    await interpreter.current!.stop();
    interpreter.current!.running = false;
  };

  const chooseFile = () => {
    loadRef.current!.click();
  };

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

  useEffect(() => {
    progRef.current!.value = DEFAULT_PROG;
    inputRef.current!.value = DEFAULT_INPUT;
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
            ["Stop", stop],
          ])
        }
        gridArea="editor"
      >
        <textarea
          ref={progRef}
          className={styles.textArea}
          name="editor"
          onChange={(e) => (progRef.current!.value = e.target.value)}
        />
      </Window>
      {/* <Window
        title="Debug"
        actions={
          new Map([
            ["Debug", () => {}],
            ["Step", () => {}],
            ["Continue", () => {}],
          ])
        }
      >
        WIP
      </Window> */}
      <Window title="Input">
        <textarea
          ref={inputRef}
          className={styles.textArea}
          name="input"
          onChange={(e) => (inputRef.current!.value = e.target.value)}
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
