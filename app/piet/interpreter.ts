const COLORS = [
  ["#FFC0C0", "#FFFFC0", "#C0FFC0", "#C0FFFF", "#C0C0FF", "#FFC0FF"],
  ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"],
  ["#C00000", "#C0C000", "#00C000", "#00C0C0", "#0000C0", "#C000C0"],
];
const WHITE = "#FFFFFF";
const BLACK = "#000000";

enum Direction {
  Up,
  Down,
  Left,
  Right,
}

type DirectionPtr = {
  x: number;
  y: number;
  dir: Direction;
};

function coord(x: number, y: number) {
  return `(${x},${y})`;
}

export class PietInterpreter {
  directionPtr: DirectionPtr;
  codelChooser: Direction;
  program: string[][];

  coordToBlock: Map<string, number>;
  blockValues: Map<number, number>;

  constructor() {
    this.directionPtr = { x: 0, y: 0, dir: Direction.Right };
    this.codelChooser = Direction.Left;
    this.program = [];

    this.coordToBlock = new Map();
    this.blockValues = new Map();
  }

  initColorBlocks() {
    let colorBlockIdx = 0;
    for (let x = 0; x < this.program[0].length; x++) {
      for (let y = 0; y < this.program.length; y++) {
        const c = coord(x, y);
        if (this.coordToBlock.has(c)) continue;
        this.exploreColorBlock(x, y, this.program[y][x], colorBlockIdx++);
      }
    }
  }

  exploreColorBlock(x: number, y: number, color: string, blockIdx: number) {
    const c = coord(x, y);

    const xInBounds = x >= 0 && x < this.program[0].length;
    const yInBounds = y >= 0 && y < this.program.length;
    if (!xInBounds || !yInBounds || this.coordToBlock.has(c)) return;

    if (this.program[y][x] === color) {
      this.coordToBlock.set(c, blockIdx);
      if (!this.blockValues.has(blockIdx)) this.blockValues.set(blockIdx, 0);
      this.blockValues.set(blockIdx, this.blockValues.get(blockIdx)! + 1);

      this.exploreColorBlock(x, y - 1, color, blockIdx);
      this.exploreColorBlock(x, y + 1, color, blockIdx);
      this.exploreColorBlock(x - 1, y, color, blockIdx);
      this.exploreColorBlock(x + 1, y, color, blockIdx);
    }
  }
}
