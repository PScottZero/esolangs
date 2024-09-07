export const COLORS = [
  ["#ffc0c0", "#ffffc0", "#c0ffc0", "#c0ffff", "#c0c0ff", "#ffc0ff"],
  ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff"],
  ["#c00000", "#c0c000", "#00c000", "#00c0c0", "#0000c0", "#c000c0"],
];
export const WHITE = "#ffffff";
export const BLACK = "#000000";

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
  value: number;
  edges: Edges;

  constructor(id: number, color: string) {
    this.id = id;
    this.color = color;
    this.value = 0;
    this.edges = new Map();
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

enum PietCommand {
  Noop,
  Push,
  Pop,
  Add,
  Subtract,
  Multiply,
  Divide,
  Mod,
  Not,
  Greater,
  Pointer,
  Switch,
  Duplicate,
  Roll,
  InNumber,
  InChar,
  OutNumber,
  OutChar,
}

export enum DirectionPtr {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export enum CodelChooser {
  Left = "left",
  Right = "right",
}

export class PietInterpreter {
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Class Vars
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  pixels: string[][];
  width: number;
  height: number;
  colorBlocks: Map<number, ColorBlock>;

  dp: DirectionPtr;
  cc: CodelChooser;
  currColorBlock: number;
  currCodel: Codel;

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Constructor
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  constructor() {
    this.pixels = [];
    this.width = 0;
    this.height = 0;
    this.colorBlocks = new Map();

    this.dp = DirectionPtr.Right;
    this.cc = CodelChooser.Left;
    this.currColorBlock = 0;
    this.currCodel = new Codel(0, 0);
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Run + Step + Stop
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  run(pixels: string[][]) {
    this.pixels = pixels;
    this.width = pixels[0].length;
    this.height = pixels.length;
    this.colorBlocks = new Map();

    this.initColorBlocks();

    this.dp = DirectionPtr.Right;
    this.cc = CodelChooser.Left;
    this.currColorBlock = 0;
    this.currCodel = new Codel(0, 0);
  }

  readCmd(): [number, number] {
    let hueChange = 0;
    let lightnessChange = 0;

    while (true) {
      const currBlock = this.colorBlocks.get(this.currColorBlock);
      const [nextBlockId, nextCodel] = currBlock?.edges
        .get(this.dp)!
        .get(this.cc) ?? [undefined, undefined];

      if (nextBlockId !== undefined) {
        const nextBlock = this.colorBlocks.get(nextBlockId)!;
        this.currColorBlock = nextBlockId;
        this.currCodel = nextCodel;
        return this.getHueAndLightnessChange(
          currBlock!.color,
          nextBlock!.color,
        );
      }
    }
  }

  getHueAndLightnessChange(color1: string, color2: string): [number, number] {
    const [hue1, light1] = this.getColorIndex(color1);
    const [hue2, light2] = this.getColorIndex(color2);
    return [
      this.getChange(hue1, hue2, COLORS[0].length),
      this.getChange(light1, light2, COLORS.length),
    ];
  }

  getChange(val1: number, val2: number, wrap: number) {
    return val1 <= val2 ? val2 - val1 : val2 + wrap - val1;
  }

  getColorIndex(color: string): [number, number] {
    for (let light = 0; light < COLORS.length; light++) {
      for (let hue = 0; hue < COLORS[0].length; hue++) {
        if (COLORS[light][hue] === color) {
          return [hue, light];
        }
      }
    }
    return [0, 0];
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
      console.log(colorBlock.str());
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
