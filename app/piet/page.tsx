"use client";

import { useEffect, useRef, useState } from "react";

import programsJson from "../../public/programs.json";
import { newAction } from "../.components/action/action";
import Programs from "../.components/programs/programs";
import Window from "../.components/window/window";
import { readImageFromServer } from "../requests";
import { BLACK, COLORS, PietInterpreter, WHITE } from "./interpreter";
import styles from "./page.module.scss";

const DEFAULT_ZOOM = 8;
const DEFAULT_PROG_SIZE = 16;
const MIN_ZOOM = 1;
const MAX_ZOOM = 50;
const MAX_CANVAS_PXS = 4096 * 4096;
const CANVAS_PADDING = 128;

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
  const [running, setRunning] = useState<boolean>(false);
  const [cliMode, setCliMode] = useState<boolean>(true);
  const [color, setColor] = useState<string>(WHITE);
  const [gridOn, setGridOn] = useState<boolean>(false);

  const programRef = useRef<string[][]>(initProgram());
  const loadRef = useRef<HTMLInputElement>(null);
  const progRef = useRef<HTMLTextAreaElement>(null);
  const ioRef = useRef<HTMLTextAreaElement>(null);
  const prevIORef = useRef<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const shiftPressedRef = useRef<boolean>(false);
  const widthRef = useRef<number>(DEFAULT_PROG_SIZE);
  const heightRef = useRef<number>(DEFAULT_PROG_SIZE);
  const zoomRef = useRef<number>(DEFAULT_ZOOM);
  const pietRef = useRef<PietInterpreter>(
    new PietInterpreter(ioRef, prevIORef, setRunning),
  );

  const drawPixel = (x: number, y: number, drawGrid: boolean) => {
    const zoom = zoomRef.current;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = programRef.current![y][x];
    ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
    if (drawGrid) {
      ctx.strokeStyle = "#7f7f7f";
      ctx.lineWidth = 0.5;
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
    let _gridOn = toggleGrid ? !gridOn : gridOn;
    setGridOn(_gridOn);

    canvasRef.current!.width = widthRef.current * zoomRef.current;
    canvasRef.current!.height = heightRef.current * zoomRef.current;

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

      const containerWidth =
        canvasContainerRef.current!.clientWidth - CANVAS_PADDING;
      const containerHeight =
        canvasContainerRef.current!.clientHeight - CANVAS_PADDING;

      let zoom = MIN_ZOOM;
      while (zoom < MAX_ZOOM) {
        zoom++;
        const canvasWidth = data.width * (zoom + 1);
        const canvasHeight = data.height * (zoom + 1);
        if (canvasWidth > containerWidth || canvasHeight > containerHeight) {
          break;
        }
      }
      zoomRef.current = zoom;
      widthRef.current = data.width;
      heightRef.current = data.height;

      drawCanvas();
    });
  };

  const wheelListener = (e: WheelEvent) => {
    if (shiftPressedRef.current) {
      const oldZoom = zoomRef.current;
      const dir = e.deltaY <= 0 ? 1 : -1;
      zoomRef.current = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, zoomRef.current + dir),
      );

      const newWidth = widthRef.current * zoomRef.current;
      const newHeight = heightRef.current * zoomRef.current;
      const pixelCount = newWidth * newHeight;

      if (pixelCount <= MAX_CANVAS_PXS) {
        drawCanvas();
      } else {
        zoomRef.current = oldZoom;
      }
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
  };

  useEffect(() => {
    init();
    addEventListener("wheel", wheelListener);
    addEventListener("keyup", keyupListener);
    addEventListener("keydown", keydownListener);
    return () => {
      removeEventListener("wheel", wheelListener);
      removeEventListener("keyup", keyupListener);
      removeEventListener("keydown", keydownListener);
    };
  }, [gridOn]);

  return (
    <main className={styles.main}>
      <Window
        title="Piet Editor"
        icon="paint.png"
        gridArea="editor"
        actions={[
          newAction("Run", () =>
            pietRef.current!.run(programRef.current, cliMode),
          ),
          newAction("Stop", () => pietRef.current!.stop(), !running),
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
          ref={ioRef}
          className="terminal"
          name="terminal"
          onChange={() => pietRef.current.setInput()}
          spellCheck={false}
        />
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
