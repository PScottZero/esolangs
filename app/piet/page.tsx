"use client";

import { useEffect, useRef, useState } from "react";
import Window from "../components/window/window";
import styles from "./page.module.scss";
import { BLACK, COLORS, PietInterpreter, WHITE } from "./interpreter";
import Image from "next/image";

const CANVAS_SCALE = 20;
const DEFAULT_PROG_SIZE = 16;

function initProgram(
  width: number = DEFAULT_PROG_SIZE,
  height: number = DEFAULT_PROG_SIZE
): string[][] {
  const program = [];
  for (let row = 0; row < height; row++) {
    const programRow = [];
    for (let col = 0; col < width; col++) {
      programRow.push(WHITE);
    }
    program.push(programRow);
  }
  return program;
}

export default function Piet() {
  const pietRef = useRef<PietInterpreter>(new PietInterpreter());
  const programRef = useRef<string[][]>(initProgram());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(DEFAULT_PROG_SIZE);
  const [height, setHeight] = useState<number>(DEFAULT_PROG_SIZE);
  const [color, setColor] = useState<string>(WHITE);
  const [gridOn, setGridOn] = useState<boolean>(true);

  const drawPixel = (x: number, y: number, drawGrid: boolean) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = programRef.current![y][x];
    ctx.fillRect(
      x * CANVAS_SCALE,
      y * CANVAS_SCALE,
      CANVAS_SCALE,
      CANVAS_SCALE
    );
    if (drawGrid) {
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x * CANVAS_SCALE,
        y * CANVAS_SCALE,
        CANVAS_SCALE,
        CANVAS_SCALE
      );
    }
  };

  const setPixel = (mouseX: number, mouseY: number) => {
    const canvas = canvasRef.current!;
    const canvasContainer = canvasContainerRef.current!;
    console.log(canvasContainer.scrollLeft, canvasContainer.scrollTop);
    const diffX = mouseX - canvas.offsetLeft + canvasContainer.scrollLeft;
    const diffY = mouseY - canvas.offsetTop + canvasContainer.scrollTop;
    const x = Math.min(Math.floor(diffX / CANVAS_SCALE), width - 1);
    const y = Math.min(Math.floor(diffY / CANVAS_SCALE), height - 1);
    programRef.current![y][x] = color;
    drawPixel(x, y, gridOn);
  };

  const drawCanvas = (drawGrid: boolean) => {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        drawPixel(y, x, drawGrid);
      }
    }
  };

  const toggleGrid = () => {
    drawCanvas(!gridOn);
    setGridOn(!gridOn);
  };

  useEffect(() => {
    drawCanvas(gridOn);
  }, []);

  const colors = [];
  for (const row of COLORS) {
    for (const col of row) {
      colors.push(
        <div style={{ background: col }} onClick={() => setColor(col)} />
      );
    }
  }
  const colorChooser = (
    <div className={styles.colorChooser}>
      <div className={styles.selectedColor} style={{ background: color }}></div>
      <div className={styles.colorOptions}>
        {colors}
        <div className={styles.white} onClick={() => setColor(WHITE)} />
        <div className={styles.black} onClick={() => setColor(BLACK)} />
      </div>
    </div>
  );

  const programEls = [];
  for (const program of ["test1.png", "test2.png"]) {
    programEls.push(
      <div key={program} className={styles.program}>
        <Image
          src="/esolangs/icons/image.png"
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
        title="Piet Editor"
        icon="paint.png"
        gridArea="editor"
        actions={[
          { name: "Run", action: () => {} },
          { name: "Stop", action: () => {}, disabled: true },
          { name: "Load", action: () => {} },
          { name: "Save", action: () => {} },
          {
            name: `Grid: ${gridOn ? "On" : "Off"}`,
            action: toggleGrid,
          },
        ]}
        underActions={colorChooser}
      >
        <div ref={canvasContainerRef} className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            width={width * CANVAS_SCALE}
            height={height * CANVAS_SCALE}
            onClick={(e) => setPixel(e.clientX, e.clientY)}
            style={{
              borderTop: gridOn ? "1px solid #555" : "",
              borderLeft: gridOn ? "1px solid #555" : "",
            }}
          />
        </div>
      </Window>
      <Window title="Terminal" icon="ms-dos.png">
        <textarea className="terminal"></textarea>
      </Window>
      <Window title="Programs" icon="folder.png">
        <div className={styles.programs}>{programEls}</div>
      </Window>
    </main>
  );
}
