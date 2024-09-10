import { Interpreter } from "../interpreter";

export const COLORS = [
  ["#ffc0c0", "#ffffc0", "#c0ffc0", "#c0ffff", "#c0c0ff", "#ffc0ff"],
  ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff"],
  ["#c00000", "#c0c000", "#00c000", "#00c0c0", "#0000c0", "#c000c0"],
];
export const WHITE = "#ffffff";
export const BLACK = "#000000";

const CMDS_PER_MS = 1;

class Codel {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  str(): string {
    return `${this.x},${this.y}`;
  }

  inBounds(maxX: number, maxY: number): boolean {
    const xInBounds = this.x >= 0 && this.x < maxX;
    const yInBounds = this.y >= 0 && this.y < maxY;
    return xInBounds && yInBounds;
  }
}

type Edge = Map<CodelChooser, [number, Codel]>;
type Edges = Map<DirectionPtr, Edge>;
type Codels = Set<Codel>;
type BoundingCodels = [DirectionPtr, Codel][];

class ColorBlock {
  id: number;
  color: string;
  hue: number;
  lightness: number;
  value: number;
  edges: Edges;

  constructor(id: number, color: string) {
    this.id = id;
    this.color = color;
    [this.hue, this.lightness] = this.getHueAndLightness();
    this.value = 0;
    this.edges = new Map();
  }

  getHueAndLightness(): [number, number] {
    for (let lightness = 0; lightness < COLORS.length; lightness++) {
      for (let hue = 0; hue < COLORS[0].length; hue++) {
        if (COLORS[lightness][hue] === this.color) {
          return [hue, lightness];
        }
      }
    }
    return [-1, -1];
  }

  getHueAndLightnessChange(nextColorBlock: ColorBlock): [number, number] {
    if (this.isNoop() || nextColorBlock.isNoop()) return [-1, -1];
    return [
      this.getChange(this.hue, nextColorBlock.hue, COLORS[0].length),
      this.getChange(this.lightness, nextColorBlock.lightness, COLORS.length),
    ];
  }

  getChange(val1: number, val2: number, wrap: number) {
    return val1 <= val2 ? val2 - val1 : val2 + wrap - val1;
  }

  isNoop(): boolean {
    return this.hue === -1 && this.lightness === -1;
  }

  str(): string {
    let colorBlockStr = `${this.id} ${this.color} ${this.value}\n`;
    this.edges.forEach((edge, dp) => {
      colorBlockStr += `${dp} edge:\n`;
      edge.forEach(([nextBlock, nextCodel], cc) => {
        colorBlockStr += `- ${cc} ${nextBlock} (${nextCodel.x}, ${nextCodel.y})\n`;
      });
    });
    return colorBlockStr + "\n";
  }
}

export enum DirectionPtr {
  Up,
  Right,
  Down,
  Left,
}

const DIRECTIONS = [
  DirectionPtr.Up,
  DirectionPtr.Right,
  DirectionPtr.Down,
  DirectionPtr.Left,
];

export enum CodelChooser {
  Left,
  Right,
}

export class PietInterpreter extends Interpreter {
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Class Vars + Constructor
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  pixels: string[][] = [];
  width: number = 0;
  height: number = 0;
  colorBlocks: Map<number, ColorBlock> = new Map();
  stack: number[] = [];

  dp: DirectionPtr = DirectionPtr.Right;
  cc: CodelChooser = CodelChooser.Left;
  currColorBlock: number = 0;
  currCodel: Codel = new Codel(0, 0);

  constructor(
    ioRef: React.RefObject<HTMLTextAreaElement>,
    prevIORef: React.MutableRefObject<string>,
    setRunning: React.Dispatch<React.SetStateAction<boolean>>,
  ) {
    super(CMDS_PER_MS, ioRef, prevIORef, setRunning);
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Control Flow
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  run(pixels: string[][], cliMode: boolean = true) {
    this.pixels = pixels;
    this.width = pixels[0].length;
    this.height = pixels.length;
    this.colorBlocks = new Map();
    this.stack = [];

    this.dp = DirectionPtr.Right;
    this.cc = CodelChooser.Left;
    this.currColorBlock = 0;
    this.currCodel = new Codel(0, 0);

    this.reset(cliMode);
    this.initColorBlocks();
    this._run();
  }

  step() {
    const prevColorBlock = this.colorBlocks.get(this.currColorBlock)!;
    const [hueChange, lightChange] = this.readCmd();

    if (!this.running) return;

    switch (hueChange) {
      case 0:
        switch (lightChange) {
          case 0:
            // TODO: noop
            // console.log("white color blocks not implemented");
            // this.running = false;
            break;
          case 1:
            this.push(prevColorBlock.value);
            break;
          case 2:
            this.pop();
            break;
        }
        break;
      case 1:
        switch (lightChange) {
          case 0:
            this.add();
            break;
          case 1:
            this.subtract();
            break;
          case 2:
            this.multiply();
            break;
        }
        break;
      case 2:
        switch (lightChange) {
          case 0:
            this.divide();
            break;
          case 1:
            this.mod();
            break;
          case 2:
            this.not();
            break;
        }
        break;
      case 3:
        switch (lightChange) {
          case 0:
            this.greater();
            break;
          case 1:
            this.pointer();
            break;
          case 2:
            this.switch();
            break;
        }
        break;
      case 4:
        switch (lightChange) {
          case 0:
            this.duplicate();
            break;
          case 1:
            this.roll();
            break;
          case 2:
            this.inNumber();
            break;
        }
        break;
      case 5:
        switch (lightChange) {
          case 0:
            this.inChar();
            break;
          case 1:
            this.outNumber();
            break;
          case 2:
            this.outChar();
            break;
        }
        break;
    }
  }

  readCmd(): [number, number] {
    let clockwiseCount = 0;
    let toggleCc: boolean = true;

    while (clockwiseCount < 4) {
      const currBlock = this.colorBlocks.get(this.currColorBlock)!;
      const [nextBlockId, nextCodel] = currBlock?.edges
        .get(this.dp)!
        .get(this.cc) ?? [undefined, undefined];

      if (nextBlockId !== undefined) {
        const nextBlock = this.colorBlocks.get(nextBlockId)!;
        this.currColorBlock = nextBlockId;
        this.currCodel = nextCodel;
        return currBlock.getHueAndLightnessChange(nextBlock);
      }

      if (toggleCc) {
        this.toggleCodelChooser();
      } else {
        clockwiseCount++;
        this.rotateDirectionPtr();
      }

      toggleCc = !toggleCc;
    }

    this.running = false;
    return [-1, -1];
  }

  rotateDirectionPtr(steps: number = 1) {
    const step = steps >= 0 ? 1 : -1;
    steps = Math.abs(steps);
    let dirIdx = DIRECTIONS.indexOf(this.dp);
    for (let i = 0; i < steps; i++) {
      dirIdx += step;
      if (dirIdx < 0) dirIdx = 3;
      if (dirIdx > 3) dirIdx = 0;
      this.dp = DIRECTIONS[dirIdx];
    }
  }

  toggleCodelChooser(steps: number = 1) {
    steps = Math.abs(steps);
    for (let i = 0; i < steps; i++) {
      this.cc =
        this.cc === CodelChooser.Left ? CodelChooser.Right : CodelChooser.Left;
    }
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Commands
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  push(value: number) {
    this.stack.push(value);
  }

  pop(): number {
    return this.stack.pop() ?? 0;
  }

  add() {
    const b = this.pop();
    const a = this.pop();
    this.stack.push(a + b);
  }

  subtract() {
    const b = this.pop();
    const a = this.pop();
    this.stack.push(a - b);
  }

  multiply() {
    const b = this.pop();
    const a = this.pop();
    this.stack.push(a * b);
  }

  divide() {
    const b = this.pop();
    const a = this.pop();
    if (b !== 0) this.stack.push(a / b);
  }

  mod() {
    const b = this.pop();
    const a = this.pop();
    this.stack.push(a < 0 ? ((a % b) + b) % b : a % b);
  }

  not() {
    this.stack.push(this.pop() === 0 ? 1 : 0);
  }

  greater() {
    const b = this.pop();
    const a = this.pop();
    this.stack.push(a > b ? 1 : 0);
  }

  pointer() {
    this.rotateDirectionPtr(this.pop());
  }

  switch() {
    this.toggleCodelChooser(this.pop());
  }

  duplicate() {
    if (this.stack.length > 0) {
      const value = this.pop();
      this.push(value);
      this.push(value);
    }
  }

  roll() {
    const rolls = this.pop();
    const depth = this.pop();

    if (depth < 0) {
      console.log("roll command received negative depth");
      return;
    }

    const rollIdx = this.stack.length - depth;
    if (rollIdx < 0) return;

    const forward = rolls >= 0;
    const absRolls = Math.abs(rolls);
    for (let roll = 0; roll < absRolls; roll++) {
      if (forward) {
        this.stack.splice(rollIdx, 0, this.pop());
      } else {
        this.stack.push(this.stack.splice(rollIdx, 1)[0]);
      }
    }
  }

  inNumber() {
    if (this.inputPtr < this.input.length) {
      this.push(parseInt(this.input.at(this.inputPtr++)!));
    } else if (this.cliMode) {
      console.log("waiting for input");
      this.waitingForInput = true;
    }
  }

  inChar() {
    if (this.inputPtr < this.input.length) {
      const i = this.input.at(this.inputPtr++)!.charCodeAt(0);
    } else if (this.cliMode) {
      console.log("waiting for input");
      this.waitingForInput = true;
    }
  }

  outNumber() {
    this.appendOutput(this.pop().toString());
  }

  outChar() {
    this.appendOutput(String.fromCharCode(this.pop()));
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Color Block Initialization
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  initColorBlocks() {
    let blockIdx = 0;
    const codelToColorBlock = new Map<string, number>();
    const colorBlockToCodels = new Map<number, Codels>();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const codel = new Codel(x, y);

        if (codelToColorBlock.has(codel.str())) continue;

        const colorBlock = new ColorBlock(blockIdx++, this.pixels[y][x]);
        const codels = this.findCodels(colorBlock, codel, codelToColorBlock);
        colorBlockToCodels.set(colorBlock.id, codels);

        this.colorBlocks.set(colorBlock.id, colorBlock);
      }
    }

    this.colorBlocks.forEach((colorBlock, colorBlockId) => {
      const boundingCodels = this.findBoundingCodels(
        colorBlockToCodels.get(colorBlockId)!,
      );
      this.findEdgeCodels(colorBlock, boundingCodels, codelToColorBlock);
    });
  }

  findCodels(
    colorBlock: ColorBlock,
    startCodel: Codel,
    codelToColorBlock: Map<string, number>,
  ): Codels {
    const codels = new Set<Codel>();
    const exploreQueue: Codel[] = [startCodel];
    while (exploreQueue.length > 0) {
      const codel = exploreQueue.pop()!;

      const inBounds = codel.inBounds(this.width, this.height);
      const visited = codelToColorBlock.has(codel.str());
      if (!inBounds || visited) continue;

      if (this.pixelColor(codel) === colorBlock.color) {
        colorBlock.value += 1;
        codels.add(codel);
        codelToColorBlock.set(codel.str(), colorBlock.id);
        exploreQueue.push(new Codel(codel.x, codel.y - 1));
        exploreQueue.push(new Codel(codel.x, codel.y + 1));
        exploreQueue.push(new Codel(codel.x - 1, codel.y));
        exploreQueue.push(new Codel(codel.x + 1, codel.y));
      }
    }

    return codels;
  }

  findBoundingCodels(codels: Codels): BoundingCodels {
    let minXCodel = new Codel(this.width, 0);
    let maxXCodel = new Codel(0, 0);
    let minYCodel = new Codel(0, this.height);
    let maxYCodel = new Codel(0, 0);

    for (const codel of Array.from(codels)) {
      if (codel.x <= minXCodel.x) minXCodel = codel;
      if (codel.x >= maxXCodel.x) maxXCodel = codel;
      if (codel.y <= minYCodel.y) minYCodel = codel;
      if (codel.y >= maxYCodel.y) maxYCodel = codel;
    }

    return [
      [DirectionPtr.Up, minYCodel],
      [DirectionPtr.Right, maxXCodel],
      [DirectionPtr.Down, maxYCodel],
      [DirectionPtr.Left, minXCodel],
    ];
  }

  findEdgeCodels(
    colorBlock: ColorBlock,
    boundingCodels: BoundingCodels,
    codelToColorBlock: Map<string, number>,
  ) {
    for (const [dp, codel] of boundingCodels) {
      colorBlock.edges.set(dp, new Map());

      for (const cc of [CodelChooser.Left, CodelChooser.Right]) {
        let found = false;
        let currCodel = codel;
        let nextCodel: Codel;

        while (!found) {
          const dir = cc === CodelChooser.Right ? 1 : -1;
          switch (dp) {
            case DirectionPtr.Up:
              nextCodel = new Codel(currCodel.x + dir, currCodel.y);
              break;
            case DirectionPtr.Right:
              nextCodel = new Codel(currCodel.x, currCodel.y + dir);
              break;
            case DirectionPtr.Down:
              nextCodel = new Codel(currCodel.x - dir, currCodel.y);
              break;
            case DirectionPtr.Left:
              nextCodel = new Codel(currCodel.x, currCodel.y - dir);
              break;
          }

          if (
            nextCodel.inBounds(this.width, this.height) &&
            this.pixelColor(nextCodel) === colorBlock.color
          ) {
            currCodel = nextCodel;
          } else {
            break;
          }
        }

        switch (dp) {
          case DirectionPtr.Up:
            nextCodel = new Codel(currCodel.x, currCodel.y - 1);
            break;
          case DirectionPtr.Right:
            nextCodel = new Codel(currCodel.x + 1, currCodel.y);
            break;
          case DirectionPtr.Down:
            nextCodel = new Codel(currCodel.x, currCodel.y + 1);
            break;
          case DirectionPtr.Left:
            nextCodel = new Codel(currCodel.x - 1, currCodel.y);
            break;
        }

        if (
          nextCodel.inBounds(this.width, this.height) &&
          this.pixelColor(nextCodel) !== BLACK
        ) {
          const nextColorBlock = codelToColorBlock.get(nextCodel.str())!;
          colorBlock.edges.get(dp)!.set(cc, [nextColorBlock, nextCodel]);
        }
      }
    }
  }

  pixelColor(codel: Codel): string {
    return this.pixels[codel.y][codel.x];
  }
}
