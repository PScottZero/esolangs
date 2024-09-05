"use client";

import { useEffect, useRef, useState } from "react";
import Window from "../components/window/window";
import styles from "./page.module.scss";
import { PietInterpreter } from "./interpreter";

const CANVAS_SCALE = 16;
const DEFAULT_PROG_SIZE = 24;

function randColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const rHex = r.toString(16).padStart(2, "0");
  const gHex = g.toString(16).padStart(2, "0");
  const bHex = b.toString(16).padStart(2, "0");
  return `#${rHex}${gHex}${bHex}`;
}

function initProgram(width: number, height: number): string[][] {
  const program = [];
  for (let row = 0; row < height; row++) {
    const programRow = [];
    for (let col = 0; col < width; col++) {
      programRow.push(randColor());
    }
    program.push(programRow);
  }
  return program;
}

export default function Piet() {
  const pietRef = useRef<PietInterpreter>(new PietInterpreter());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const programRef = useRef<string[][]>(
    initProgram(DEFAULT_PROG_SIZE, DEFAULT_PROG_SIZE)
  );
  const [width, setWidth] = useState<number>(DEFAULT_PROG_SIZE);
  const [height, setHeight] = useState<number>(DEFAULT_PROG_SIZE);

  const drawPixel = (x: number, y: number) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = programRef.current![y][x];
    ctx.fillRect(
      x * CANVAS_SCALE,
      y * CANVAS_SCALE,
      CANVAS_SCALE,
      CANVAS_SCALE
    );
  };

  const setPixel = (mouseX: number, mouseY: number) => {
    const diffX = mouseX - canvasRef.current!.offsetLeft;
    const diffY = mouseY - canvasRef.current!.offsetTop;
    const x = Math.min(Math.floor(diffX / CANVAS_SCALE), width - 1);
    const y = Math.min(Math.floor(diffY / CANVAS_SCALE), height - 1);
    programRef.current![y][x] = randColor();
    drawPixel(x, y);
  };

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        ctx.fillStyle = programRef.current![y][x];
        ctx.fillRect(
          x * CANVAS_SCALE,
          y * CANVAS_SCALE,
          CANVAS_SCALE,
          CANVAS_SCALE
        );
      }
    }
  }, []);

  return (
    <main className={styles.main}>
      <Window title="Piet Editor" icon="paint.png" gridArea="editor">
        <div className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            width={width * CANVAS_SCALE}
            height={height * CANVAS_SCALE}
            onClick={(e) => setPixel(e.clientX, e.clientY)}
          />
        </div>
      </Window>
      <Window title="Terminal" icon="ms-dos.png">
        <textarea className="terminal"></textarea>
      </Window>
      <Window title="Programs" icon="folder.png"></Window>
    </main>
  );
}
