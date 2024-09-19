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
  codelToColorBlock: Map<string, number> = new Map();
  colorBlockToCodels: Map<number, Codels> = new Map();
  stack: number[] = [];

  dp: DirectionPtr = DirectionPtr.Right;
  cc: CodelChooser = CodelChooser.Left;
  currColorBlock: number = 0;
  currCodel: Codel = new Codel(0, 0);

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

    if (this.waitingForInput) this.currColorBlock = prevColorBlock.id;
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

  noopSlide() {
    const colorBlockColor = this.colorBlocks.get(this.currColorBlock)!.color;
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

      const nextCodel = this.getNextCodel(
        this.dp,
        () => new Codel(this.currCodel.x, this.currCodel.y - 1),
        () => new Codel(this.currCodel.x + 1, this.currCodel.y),
        () => new Codel(this.currCodel.x, this.currCodel.y + 1),
        () => new Codel(this.currCodel.x - 1, this.currCodel.y),
      );

      if (
        this.codelInBounds(nextCodel) &&
        this.pixelColor(nextCodel) !== BLACK
      ) {
        this.currCodel = nextCodel;
        addCodelToPath = true;
        if (this.pixelColor(nextCodel) !== colorBlockColor) {
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
    if (this.inputPtr < this.input.length) {
      this.push(parseInt(this.input.trim()));
      this.inputPtr = this.input.length;
    } else if (this.cliMode) {
      this.waitingForInput = true;
    }
  }

  inChar() {
    if (this.inputPtr < this.input.length) {
      this.push(this.input.at(this.inputPtr++)!.charCodeAt(0));
    } else if (this.cliMode) {
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
    this.codelToColorBlock = new Map();
    this.colorBlockToCodels = new Map();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const codel = new Codel(x, y);

        if (this.codelToColorBlock.has(codel.id)) continue;

        const colorBlock = new ColorBlock(blockIdx++, this.pixels[y][x]);
        const codels = this.findCodels(colorBlock, codel);
        this.colorBlockToCodels.set(colorBlock.id, codels);

        this.colorBlocks.set(colorBlock.id, colorBlock);
      }
    }

    this.colorBlocks.forEach((cb, _) => this.findColorBlockEdges(cb));
  }

  findCodels(colorBlock: ColorBlock, startCodel: Codel): Codels {
    const codels = new Set<Codel>();
    const exploreQueue: Codel[] = [startCodel];
    while (exploreQueue.length > 0) {
      const codel = exploreQueue.pop()!;

      const inBounds = this.codelInBounds(codel);
      const visited = this.codelToColorBlock.has(codel.id);
      if (!inBounds || visited) continue;

      if (this.pixelColor(codel) === colorBlock.color) {
        colorBlock.value += 1;
        codels.add(codel);
        this.codelToColorBlock.set(codel.id, colorBlock.id);
        exploreQueue.push(new Codel(codel.x, codel.y - 1));
        exploreQueue.push(new Codel(codel.x, codel.y + 1));
        exploreQueue.push(new Codel(codel.x - 1, codel.y));
        exploreQueue.push(new Codel(codel.x + 1, codel.y));
      }
    }

    return codels;
  }

  findColorBlockEdges(colorBlock: ColorBlock) {
    const boundingCodels = this.findBoundingCodels(colorBlock.id);

    for (const [dp, codel] of boundingCodels) {
      colorBlock.edges.set(dp, new Map());

      for (const cc of [CodelChooser.Left, CodelChooser.Right]) {
        let currCodel = codel;

        while (true) {
          const step = cc === CodelChooser.Right ? 1 : -1;
          const nextCodel = this.getNextCodel(
            dp,
            () => new Codel(currCodel.x + step, currCodel.y),
            () => new Codel(currCodel.x, currCodel.y + step),
            () => new Codel(currCodel.x - step, currCodel.y),
            () => new Codel(currCodel.x, currCodel.y - step),
          );

          if (
            this.codelInBounds(nextCodel) &&
            this.pixelColor(nextCodel) === colorBlock.color
          ) {
            currCodel = nextCodel;
          } else {
            break;
          }
        }

        const nextCodel = this.getNextCodel(
          dp,
          () => new Codel(currCodel.x, currCodel.y - 1),
          () => new Codel(currCodel.x + 1, currCodel.y),
          () => new Codel(currCodel.x, currCodel.y + 1),
          () => new Codel(currCodel.x - 1, currCodel.y),
        );

        if (
          this.codelInBounds(nextCodel) &&
          this.pixelColor(nextCodel) !== BLACK
        ) {
          const nextColorBlock = this.codelToColorBlock.get(nextCodel.id)!;
          colorBlock.edges.get(dp)!.set(cc, [nextColorBlock, nextCodel]);
        }
      }
    }
  }

  findBoundingCodels(colorBlockId: number): BoundingCodels {
    const codels = this.colorBlockToCodels.get(colorBlockId)!;

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

  getNextCodel(
    dp: DirectionPtr,
    upCodel: () => Codel,
    rightCodel: () => Codel,
    downCodel: () => Codel,
    leftCodel: () => Codel,
  ): Codel {
    switch (dp) {
      case DirectionPtr.Up:
        return upCodel();
      case DirectionPtr.Right:
        return rightCodel();
      case DirectionPtr.Down:
        return downCodel();
      case DirectionPtr.Left:
        return leftCodel();
    }
  }

  codelInBounds(codel: Codel): boolean {
    const xInBounds = codel.x >= 0 && codel.x < this.width;
    const yInBounds = codel.y >= 0 && codel.y < this.height;
    return xInBounds && yInBounds;
  }

  pixelColor(codel: Codel): string {
    return this.pixels[codel.y][codel.x];
  }
}
