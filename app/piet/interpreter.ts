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
  id: string;
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.id = `${x},${y}`;
    this.x = x;
    this.y = y;
  }

  getMainAxisCoord(edge: DirectionPtr) {
    return edge === DirectionPtr.Left || edge === DirectionPtr.Right
      ? this.x
      : this.y;
  }

  getCrossAxisCoord(edge: DirectionPtr) {
    return edge === DirectionPtr.Left || edge === DirectionPtr.Right
      ? this.y
      : this.x;
  }
}

type Edge = Map<CodelChooser, [ColorBlock, Codel]>;

class ColorBlock {
  id: number;
  color: string;
  hue: number;
  lightness: number;
  value: number;

  edges: Map<DirectionPtr, Edge>;
  codels: Set<Codel>;

  constructor(id: number, color: string) {
    this.id = id;
    this.color = color;
    [this.hue, this.lightness] = this.getHueAndLightness();
    this.value = 0;

    this.edges = new Map();
    this.codels = new Set();
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
    if (this.isNoop() || nextColorBlock.isNoop()) return [0, 0];
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
}

export enum DirectionPtr {
  Up = "up",
  Right = "right",
  Down = "down",
  Left = "left",
}

const DIRECTIONS = [
  DirectionPtr.Up,
  DirectionPtr.Right,
  DirectionPtr.Down,
  DirectionPtr.Left,
];

export enum CodelChooser {
  Left = "left",
  Right = "right",
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

  colorBlocks: ColorBlock[] = [];
  codelToColorBlock: Map<string, ColorBlock> = new Map();

  dp: DirectionPtr = DirectionPtr.Right;
  cc: CodelChooser = CodelChooser.Left;
  currColorBlock: ColorBlock = new ColorBlock(0, "");
  currCodel: Codel = new Codel(0, 0);

  stack: number[] = [];

  constructor(setRunning: (running: boolean) => void) {
    super(CMDS_PER_MS, setRunning);
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Control Flow
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  async run(pixels: string[][], cliMode: boolean = true) {
    if (this.running) await this.stop();

    this.pixels = pixels;
    this.width = pixels[0].length;
    this.height = pixels.length;

    this.colorBlocks = [];
    this.codelToColorBlock = new Map();

    this.dp = DirectionPtr.Right;
    this.cc = CodelChooser.Left;
    this.currColorBlock = new ColorBlock(0, "");
    this.currCodel = new Codel(0, 0);

    this.stack = [];

    this.reset(cliMode);
    this.initProgram();
    this._run();
  }

  step() {
    const prevColorBlock = this.currColorBlock;
    const [hueChange, lightChange] = this.readCmd();

    if (!this.running) return;

    switch (hueChange) {
      case 0:
        switch (lightChange) {
          case 0:
            this.noopSlide();
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

    if (this.waitingForInput) this.currColorBlock = prevColorBlock;
  }

  readCmd(): [number, number] {
    let clockwiseCount = 0;
    let toggleCc: boolean = true;

    while (clockwiseCount < 4) {
      const currBlock = this.currColorBlock;
      const [nextBlock, nextCodel] = currBlock?.edges
        .get(this.dp)!
        .get(this.cc) ?? [undefined, undefined];

      if (nextBlock !== undefined) {
        this.currColorBlock = nextBlock;
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

  noopSlide() {
    let path = "";
    let prevPath = "";

    let clockwiseCount = 0;
    let toggleCc = true;
    let addCodelToPath = true;

    while (true) {
      if (addCodelToPath) {
        path += this.currCodel.id + ":";
        addCodelToPath = false;
      }

      const nextCodel = this.getNextCodel(this.currCodel, this.dp);

      if (this.codelInBounds(nextCodel)) {
        this.currCodel = nextCodel;
        addCodelToPath = true;
        if (this.codelColor(nextCodel) !== this.currColorBlock.color) {
          this.currColorBlock = this.codelToColorBlock.get(nextCodel.id)!;
          return;
        }
      } else {
        if (toggleCc) {
          this.toggleCodelChooser();
        } else {
          if (++clockwiseCount === 4) {
            if (path === prevPath) break;
            prevPath = path;
            path = "";
            clockwiseCount = 0;
          }
          this.rotateDirectionPtr();
        }
        toggleCc = !toggleCc;
      }
    }

    this.running = false;
    return [-1, -1];
  }

  rotateDirectionPtr(steps: number = 1) {
    const stepDir = steps >= 0 ? 1 : -1;
    steps = Math.abs(steps);
    let dirIdx = DIRECTIONS.indexOf(this.dp);
    for (let i = 0; i < steps; i++) {
      dirIdx += stepDir;
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
    const [b, a] = [this.pop(), this.pop()];
    this.stack.push(a + b);
  }

  subtract() {
    const [b, a] = [this.pop(), this.pop()];
    this.stack.push(a - b);
  }

  multiply() {
    const [b, a] = [this.pop(), this.pop()];
    this.stack.push(a * b);
  }

  divide() {
    const [b, a] = [this.pop(), this.pop()];
    if (b !== 0) this.stack.push(Math.floor(a / b));
  }

  mod() {
    const [b, a] = [this.pop(), this.pop()];
    if (b !== 0) this.stack.push(((a % b) + b) % b);
  }

  not() {
    this.stack.push(this.pop() === 0 ? 1 : 0);
  }

  greater() {
    const [b, a] = [this.pop(), this.pop()];
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
    this.readInputNumber((num) => this.push(num));
  }

  inChar() {
    this.readInputChar((ch) => this.push(ch));
  }

  outNumber() {
    const val = this.pop();
    if (val > 0) this.appendOutput(val.toString());
  }

  outChar() {
    const val = this.pop();
    if (val > 0) this.appendOutput(String.fromCharCode(val));
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Program Initialization
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  initProgram() {
    let blockIdx = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const codel = new Codel(x, y);
        if (this.codelToColorBlock.has(codel.id)) continue;

        const colorBlock = new ColorBlock(blockIdx++, this.pixels[y][x]);
        this.findCodels(colorBlock, codel);
        this.colorBlocks.push(colorBlock);
      }
    }
    this.colorBlocks.forEach((cb) => this.findColorBlockEdges(cb));
    this.currColorBlock = this.colorBlocks[0];
  }

  findCodels(colorBlock: ColorBlock, startCodel: Codel) {
    const exploreQueue: Codel[] = [startCodel];
    while (exploreQueue.length > 0) {
      const codel = exploreQueue.pop()!;
      if (
        !this.codelInBounds(codel, true) ||
        this.codelToColorBlock.has(codel.id) ||
        this.codelColor(codel) !== colorBlock.color
      ) {
        continue;
      }

      colorBlock.value += 1;
      colorBlock.codels.add(codel);
      this.codelToColorBlock.set(codel.id, colorBlock);

      exploreQueue.push(
        this.getNextCodel(codel, DirectionPtr.Up),
        this.getNextCodel(codel, DirectionPtr.Right),
        this.getNextCodel(codel, DirectionPtr.Down),
        this.getNextCodel(codel, DirectionPtr.Left),
      );
    }
  }

  findColorBlockEdges(colorBlock: ColorBlock) {
    let up = this.height;
    let right = 0;
    let down = 0;
    let left = this.width;

    for (const codel of Array.from(colorBlock.codels)) {
      if (codel.y <= up) up = codel.y;
      if (codel.x >= right) right = codel.x;
      if (codel.y >= down) down = codel.y;
      if (codel.x <= left) left = codel.x;
    }

    this.findBoundingEdgeCodels(colorBlock, DirectionPtr.Up, up);
    this.findBoundingEdgeCodels(colorBlock, DirectionPtr.Right, right);
    this.findBoundingEdgeCodels(colorBlock, DirectionPtr.Down, down);
    this.findBoundingEdgeCodels(colorBlock, DirectionPtr.Left, left);
  }

  findBoundingEdgeCodels(
    colorBlock: ColorBlock,
    edge: DirectionPtr,
    edgeBound: number,
  ) {
    const edgeCodels: Codel[] = [];
    for (const codel of Array.from(colorBlock.codels)) {
      if (codel.getMainAxisCoord(edge) === edgeBound) edgeCodels.push(codel);
    }

    let minCodel = new Codel(-1, -1);
    let maxCodel = new Codel(-1, -1);
    for (const codel of edgeCodels) {
      const val = codel.getCrossAxisCoord(edge);
      const minVal = minCodel.getCrossAxisCoord(edge);
      const maxVal = maxCodel.getCrossAxisCoord(edge);
      if (minVal < 0 || val <= minVal) minCodel = codel;
      if (maxVal < 0 || val >= maxVal) maxCodel = codel;
    }
    const nextMinCodel = this.getNextCodel(minCodel, edge);
    const nextMaxCodel = this.getNextCodel(maxCodel, edge);

    const flipMinMax = edge === DirectionPtr.Down || edge === DirectionPtr.Left;
    const leftCodel = flipMinMax ? nextMaxCodel : nextMinCodel;
    const rightCodel = flipMinMax ? nextMinCodel : nextMaxCodel;

    const edgeCCMap: Edge = new Map();
    if (this.codelInBounds(leftCodel)) {
      edgeCCMap.set(CodelChooser.Left, [
        this.codelToColorBlock.get(leftCodel.id)!,
        leftCodel,
      ]);
    }
    if (this.codelInBounds(rightCodel)) {
      edgeCCMap.set(CodelChooser.Right, [
        this.codelToColorBlock.get(rightCodel.id)!,
        rightCodel,
      ]);
    }
    colorBlock.edges.set(edge, edgeCCMap);
  }

  getNextCodel(codel: Codel, dp: DirectionPtr): Codel {
    switch (dp) {
      case DirectionPtr.Up:
        return new Codel(codel.x, codel.y - 1);
      case DirectionPtr.Right:
        return new Codel(codel.x + 1, codel.y);
      case DirectionPtr.Down:
        return new Codel(codel.x, codel.y + 1);
      case DirectionPtr.Left:
        return new Codel(codel.x - 1, codel.y);
    }
  }

  codelInBounds(codel: Codel, blackInBounds: boolean = false): boolean {
    const xInBounds = codel.x >= 0 && codel.x < this.width;
    const yInBounds = codel.y >= 0 && codel.y < this.height;
    if (xInBounds && yInBounds) {
      return blackInBounds || this.codelColor(codel) !== BLACK;
    }
    return false;
  }

  codelColor(codel: Codel) {
    return this.pixels[codel.y][codel.x];
  }
}
