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

class CanvasRefs {
  canvasEl: HTMLCanvasElement | null = null;
  canvasContainerEl: HTMLDivElement | null = null;
  width: number = DEFAULT_PROG_SIZE;
  height: number = DEFAULT_PROG_SIZE;
  showGrid: boolean = false;
  zoom: number = DEFAULT_ZOOM;
  shiftPressed: boolean = false;
  program: string[][] = initProgram();

  setCanvasEl(canvasEl: HTMLCanvasElement) {
    this.canvasEl = canvasEl;
  }

  setCanvasContainerEl(canvasContainerEl: HTMLDivElement) {
    this.canvasContainerEl = canvasContainerEl;
  }
}

export default function Piet() {
  const [running, setRunning] = useState<boolean>(false);
  const [cliMode, setCliMode] = useState<boolean>(true);
  const [color, setColor] = useState<string>(WHITE);

  const canvasRefs = useRef<CanvasRefs>(new CanvasRefs());
  const pietRef = useRef(new PietInterpreter(setRunning));

  const drawPixel = (x: number, y: number, drawGrid: boolean) => {
    const zoom = canvasRefs.current.zoom;
    const ctx = canvasRefs.current.canvasEl!.getContext("2d")!;
    ctx.fillStyle = canvasRefs.current.program[y][x];
    ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
    if (drawGrid) {
      ctx.strokeStyle = "#7f7f7f";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x * zoom, y * zoom, zoom, zoom);
    }
  };

  const setPixel = (mouseX: number, mouseY: number) => {
    const zoom = canvasRefs.current.zoom;
    const canvas = canvasRefs.current.canvasEl!;
    const canvasContainer = canvasRefs.current.canvasContainerEl!;
    const diffX = mouseX - canvas.offsetLeft + canvasContainer.scrollLeft;
    const diffY = mouseY - canvas.offsetTop + canvasContainer.scrollTop;
    const x = Math.min(Math.floor(diffX / zoom), canvasRefs.current.width - 1);
    const y = Math.min(Math.floor(diffY / zoom), canvasRefs.current.height - 1);
    canvasRefs.current.program[y][x] = color;
    drawPixel(x, y, false);
  };

  const drawCanvas = (toggleGrid: boolean = false) => {
    // let _gridOn = toggleGrid ? !gridOn : gridOn;
    // if (toggleGrid) setGridOn((on) => !on);

    canvasRefs.current.canvasEl!.width =
      canvasRefs.current.width * canvasRefs.current.zoom;
    canvasRefs.current.canvasEl!.height =
      canvasRefs.current.height * canvasRefs.current.zoom;

    for (let y = 0; y < canvasRefs.current.height; y++) {
      for (let x = 0; x < canvasRefs.current.width; x++) {
        drawPixel(x, y, false);
      }
    }
  };

  const loadImage = async (image: string) => {
    await readImageFromServer(image, (data) => {
      canvasRefs.current.program = initProgram(data.width, data.height);
      for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
          const px = 4 * (y * data.width + x);
          const r = data.data[px].toString(16).padStart(2, "0");
          const g = data.data[px + 1].toString(16).padStart(2, "0");
          const b = data.data[px + 2].toString(16).padStart(2, "0");
          canvasRefs.current.program[y][x] = `#${r}${g}${b}`;
        }
      }

      const containerWidth =
        canvasRefs.current.canvasContainerEl!.clientWidth - CANVAS_PADDING;
      const containerHeight =
        canvasRefs.current.canvasContainerEl!.clientHeight - CANVAS_PADDING;

      let zoom = MIN_ZOOM;
      while (zoom < MAX_ZOOM) {
        zoom++;
        const canvasWidth = data.width * (zoom + 1);
        const canvasHeight = data.height * (zoom + 1);
        if (canvasWidth > containerWidth || canvasHeight > containerHeight) {
          break;
        }
      }
      canvasRefs.current.zoom = zoom;
      canvasRefs.current.width = data.width;
      canvasRefs.current.height = data.height;

      drawCanvas();
    });
  };

  const wheelListener = (e: WheelEvent) => {
    if (canvasRefs.current.shiftPressed) {
      const oldZoom = canvasRefs.current.zoom;
      const dir = e.deltaY <= 0 ? 1 : -1;
      canvasRefs.current.zoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, canvasRefs.current.zoom + dir),
      );

      const newWidth = canvasRefs.current.width * canvasRefs.current.zoom;
      const newHeight = canvasRefs.current.height * canvasRefs.current.zoom;
      const pixelCount = newWidth * newHeight;

      if (pixelCount <= MAX_CANVAS_PXS) {
        drawCanvas();
      } else {
        canvasRefs.current.zoom = oldZoom;
      }
    }
  };

  const keyupListener = (e: KeyboardEvent) => {
    if (e.key === "Shift") canvasRefs.current.shiftPressed = false;
  };

  const keydownListener = (e: KeyboardEvent) => {
    if (e.key === "Shift") canvasRefs.current.shiftPressed = true;
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
  }, []);

  return (
    <main className={styles.main}>
      <Window
        title="Piet Editor"
        icon="paint.png"
        gridArea="editor"
        actions={[
          newAction("Run", () =>
            pietRef.current!.run(canvasRefs.current.program, cliMode),
          ),
          newAction("Stop", () => pietRef.current.stop(), !running),
          newAction("Load", () => {}),
          newAction("Save", () => {}),
          // newAction(`Grid: ${gridOn ? "On" : "Off"}`, () => drawCanvas(true)),
        ]}
        sidebar={ColorChooser(color, setColor)}
      >
        <div
          ref={(el) => canvasRefs.current.setCanvasContainerEl(el!)}
          className={styles.canvasContainer}
        >
          <canvas
            ref={(el) => canvasRefs.current.setCanvasEl(el!)}
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
            () => setCliMode((mode) => !mode),
            running,
          ),
        ]}
      >
        <textarea
          ref={(el) => {
            pietRef.current.ioEl = el;
          }}
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
