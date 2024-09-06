"use client";

import { useEffect, useRef, useState } from "react";

import programsJson from "../../public/programs.json";
import { newAction } from "../components/action/action";
import Programs from "../components/programs/programs";
import Window from "../components/window/window";
import { readImageFromServer } from "../requests";
import { BLACK, COLORS, PietInterpreter, WHITE } from "./interpreter";
import styles from "./page.module.scss";

const DEFAULT_ZOOM = 10;
const DEFAULT_PROG_SIZE = 16;
const ZOOM_MIN = 1;
const ZOOM_MAX = 25;

function initProgram(
  width: number = DEFAULT_PROG_SIZE,
  height: number = DEFAULT_PROG_SIZE,
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

function ColorChooser(
  selectedColor: string,
  setColor: (color: string) => void,
) {
  const colors = [];
  for (let col = 0; col < COLORS[0].length; col++) {
    for (let row = 0; row < COLORS.length; row++) {
      const _color = COLORS[row][col];
      colors.push(
        <div
          key={_color}
          style={{ background: _color }}
          onClick={() => setColor(_color)}
        />,
      );
    }
  }

  return (
    <div className={styles.colorChooser}>
      <div
        className={styles.selectedColor}
        style={{ background: selectedColor }}
      />
      <div className={styles.colorOptions}>
        {colors}
        <div
          key={WHITE}
          style={{ background: WHITE }}
          onClick={() => setColor(WHITE)}
        />
        <div
          key={BLACK}
          style={{ background: BLACK }}
          onClick={() => setColor(BLACK)}
        />
      </div>
    </div>
  );
}

export default function Piet() {
  const pietRef = useRef<PietInterpreter>(new PietInterpreter());
  const programRef = useRef<string[][]>(initProgram());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const shiftPressedRef = useRef<boolean>(false);
  const widthRef = useRef<number>(DEFAULT_PROG_SIZE);
  const heightRef = useRef<number>(DEFAULT_PROG_SIZE);
  const zoomRef = useRef<number>(DEFAULT_ZOOM);
  const [color, setColor] = useState<string>(WHITE);
  const [gridOn, setGridOn] = useState<boolean>(true);
  const [redraw, setRedraw] = useState<boolean>(false);

  const getCanvasWidth = () => canvasRef.current!.width;
  const setCanvasWidth = () =>
    (canvasRef.current!.width = widthRef.current * zoomRef.current);
  const getCanvasHeight = () => canvasRef.current!.height;
  const setCanvasHeight = () =>
    (canvasRef.current!.height = heightRef.current * zoomRef.current);
  const setWidth = (width: number) => {
    widthRef.current = width;
    setCanvasWidth();
  };
  const setHeight = (height: number) => {
    heightRef.current = height;
    setCanvasHeight();
  };

  const drawPixel = (x: number, y: number, drawGrid: boolean) => {
    const zoom = zoomRef.current;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = programRef.current![y][x];
    ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
    if (drawGrid) {
      ctx.strokeStyle = "#7f7f7f";
      ctx.lineWidth = 1;
      ctx.strokeRect(x * zoom, y * zoom, zoom, zoom);
    }
  };

  const setPixel = (mouseX: number, mouseY: number) => {
    const zoom = zoomRef.current;
    const canvas = canvasRef.current!;
    const canvasContainer = canvasContainerRef.current!;
    const diffX = mouseX - canvas.offsetLeft + canvasContainer.scrollLeft;
    const diffY = mouseY - canvas.offsetTop + canvasContainer.scrollTop;
    const x = Math.min(Math.floor(diffX / zoom), widthRef.current - 1);
    const y = Math.min(Math.floor(diffY / zoom), heightRef.current - 1);
    programRef.current![y][x] = color;
    drawPixel(x, y, gridOn);
  };

  const drawCanvas = (toggleGrid: boolean = false) => {
    let _gridOn = gridOn;
    if (toggleGrid) {
      _gridOn = !gridOn;
      setGridOn(_gridOn);
    }
    for (let y = 0; y < heightRef.current; y++) {
      for (let x = 0; x < widthRef.current; x++) {
        drawPixel(x, y, _gridOn);
      }
    }
  };

  const loadImage = async (image: string) => {
    await readImageFromServer(image, (data) => {
      programRef.current! = initProgram(data.width, data.height);
      for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
          const px = 4 * (y * data.width + x);
          const r = data.data[px].toString(16).padStart(2, "0");
          const g = data.data[px + 1].toString(16).padStart(2, "0");
          const b = data.data[px + 2].toString(16).padStart(2, "0");
          programRef.current![y][x] = `#${r}${g}${b}`;
        }
      }
      setWidth(data.width);
      setHeight(data.height);
      setRedraw(true);
    });
  };

  const wheelListener = (e: WheelEvent) => {
    if (shiftPressedRef.current) {
      const dir = e.deltaY <= 0 ? 1 : -1;
      zoomRef.current = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, zoomRef.current + dir),
      );
      setCanvasWidth();
      setCanvasHeight();
      setRedraw(true);
    }
  };

  const keyupListener = (e: KeyboardEvent) => {
    if (e.key === "Shift") shiftPressedRef.current = false;
  };

  const keydownListener = (e: KeyboardEvent) => {
    if (e.key === "Shift") shiftPressedRef.current = true;
  };

  const init = async () => {
    await loadImage(programsJson.piet.default);
    drawCanvas();
  };

  useEffect(() => {
    setWidth(DEFAULT_PROG_SIZE);
    setHeight(DEFAULT_PROG_SIZE);
    init();
    addEventListener("wheel", wheelListener);
    addEventListener("keyup", keyupListener);
    addEventListener("keydown", keydownListener);
    return () => {
      removeEventListener("wheel", wheelListener);
      removeEventListener("keyup", keyupListener);
      removeEventListener("keydown", keydownListener);
    };
  }, []);

  if (redraw) {
    drawCanvas();
    setRedraw(false);
  }

  return (
    <main className={styles.main}>
      <Window
        title="Piet Editor"
        icon="paint.png"
        gridArea="editor"
        actions={[
          newAction("Run", () => {}),
          newAction("Stop", () => {}, true),
          newAction("Load", () => {}),
          newAction("Save", () => {}),
          newAction(`Grid: ${gridOn ? "On" : "Off"}`, () => drawCanvas(true)),
        ]}
        sidebar={ColorChooser(color, setColor)}
      >
        <div ref={canvasContainerRef} className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            onClick={(e) => setPixel(e.clientX, e.clientY)}
          />
        </div>
      </Window>
      <Window title="Terminal" icon="ms-dos.png">
        <textarea className="terminal"></textarea>
      </Window>
      <Programs
        programs={programsJson.piet.programs}
        programIcon="image.png"
        onClick={(program: string) =>
          loadImage(`${programsJson.piet.path}/${program}`)
        }
      />
    </main>
  );
}
