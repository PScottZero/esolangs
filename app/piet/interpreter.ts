export const COLORS = [
  ["#FFC0C0", "#FFFFC0", "#C0FFC0", "#C0FFFF", "#C0C0FF", "#FFC0FF"],
  ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"],
  ["#C00000", "#C0C000", "#00C000", "#00C0C0", "#0000C0", "#C000C0"],
];
export const WHITE = "#FFFFFF";
export const BLACK = "#000000";

enum DirectionPtr {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

enum CodelChooser {
  Left,
  Right,
}

type Edge = Map<CodelChooser, Map<DirectionPtr, number>>;

type ColorBlock = {
  color: string;
  value: number;
  edges: Map<DirectionPtr, Edge>;
};

class Coord {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  str(): string {
    return `(${this.x},${this.y})`;
  }

  set(coord: Coord) {
    this.x = coord.x;
    this.y = coord.y;
  }

  inBounds(maxX: number, maxY: number): boolean {
    const xInBounds = this.x >= 0 && this.x < maxX;
    const yInBounds = this.y >= 0 && this.y < maxY;
    return xInBounds && yInBounds;
  }
}

export class PietInterpreter {
  directionPtr: DirectionPtr;
  codelChooser: CodelChooser;
  colorBlockPtr: number;

  program: string[][];
  colorBlocks: Map<number, ColorBlock>;

  constructor() {
    this.directionPtr = DirectionPtr.Right;
    this.codelChooser = CodelChooser.Left;
    this.colorBlockPtr = 0;

    this.program = [];
    this.colorBlocks = new Map();
  }

  run(program: string[][]) {
    this.directionPtr = DirectionPtr.Right;
    this.codelChooser = CodelChooser.Left;
    this.colorBlockPtr = 0;

    this.program = program;
    this.colorBlocks = new Map();

    this.initColorBlocks();
  }

  initColorBlocks() {
    let blockIdx = 0;
    const visited = new Set<string>();
    for (let y = 0; y < this.program.length; y++) {
      for (let x = 0; x < this.program[y].length; x++) {
        const coord = new Coord(x, y);
        if (visited.has(coord.str())) continue;

        const currBlockIdx = blockIdx++;
        const currBlockColor = this.program[y][x];
        const exploreQueue: Coord[] = [coord];

        console.log(currBlockIdx);

        const colorBlock: ColorBlock = {
          color: currBlockColor,
          value: 0,
          edges: new Map(),
        };
        this.colorBlocks.set(currBlockIdx, colorBlock);
        this.exploreColorBlock(colorBlock, exploreQueue, visited);
      }
    }
  }

  exploreColorBlock(
    colorBlock: ColorBlock,
    exploreQueue: Coord[],
    visited: Set<string>,
  ) {
    const progWidth = this.program[0].length;
    const progHeight = this.program.length;

    const minXCoord = new Coord(progWidth, 0);
    const maxXCoord = new Coord(0, 0);
    const minYCoord = new Coord(0, progHeight);
    const maxYCoord = new Coord(0, 0);

    while (exploreQueue.length > 0) {
      const coord = exploreQueue.pop()!;

      if (!coord.inBounds(progWidth, progHeight) || visited.has(coord.str()))
        continue;

      if (this.program[coord.y][coord.x] === colorBlock.color) {
        visited.add(coord.str());
        colorBlock.value += 1;

        if (coord.x <= minXCoord.x) minXCoord.set(coord);
        if (coord.x >= maxXCoord.x) maxXCoord.set(coord);
        if (coord.y <= minYCoord.y) minYCoord.set(coord);
        if (coord.y >= maxYCoord.y) maxYCoord.set(coord);

        exploreQueue.push(new Coord(coord.x, coord.y - 1));
        exploreQueue.push(new Coord(coord.x, coord.y + 1));
        exploreQueue.push(new Coord(coord.x - 1, coord.y));
        exploreQueue.push(new Coord(coord.x + 1, coord.y));
      }
    }

    console.log(colorBlock);
    this.exploreColorBlockEdge(colorBlock, DirectionPtr.Left, minXCoord);
    this.exploreColorBlockEdge(colorBlock, DirectionPtr.Right, maxXCoord);
    this.exploreColorBlockEdge(colorBlock, DirectionPtr.Up, minYCoord);
    this.exploreColorBlockEdge(colorBlock, DirectionPtr.Down, maxYCoord);
  }

  exploreColorBlockEdge(
    colorBlock: ColorBlock,
    edge: DirectionPtr,
    blockCoord: Coord,
  ) {
    const progWidth = this.program[0].length;
    const progHeight = this.program.length;

    let leftCoord = blockCoord;
    let rightCoord = blockCoord;
    let rightFound = false;
    let leftFound = false;

    while (!leftFound || !rightFound) {
      let newLeftCoord: Coord;
      let newRightCoord: Coord;

      switch (edge) {
        case DirectionPtr.Left:
          newLeftCoord = new Coord(leftCoord.x, leftCoord.y + 1);
          newRightCoord = new Coord(rightCoord.x, rightCoord.y - 1);
          break;
        case DirectionPtr.Right:
          newLeftCoord = new Coord(leftCoord.x, leftCoord.y - 1);
          newRightCoord = new Coord(rightCoord.x, rightCoord.y + 1);
          break;
        case DirectionPtr.Up:
          newLeftCoord = new Coord(leftCoord.x - 1, leftCoord.y);
          newRightCoord = new Coord(rightCoord.x + 1, rightCoord.y);
          break;
        case DirectionPtr.Down:
          newLeftCoord = new Coord(leftCoord.x + 1, leftCoord.y);
          newRightCoord = new Coord(rightCoord.x - 1, rightCoord.y);
          break;
      }

      if (!leftFound) {
        if (
          newLeftCoord.inBounds(progWidth, progHeight) &&
          this.program[newLeftCoord.y][newLeftCoord.x] == colorBlock.color
        ) {
          leftCoord = newLeftCoord;
        } else {
          leftFound = true;
        }
      }

      if (!rightFound) {
        if (
          newRightCoord.inBounds(progWidth, progHeight) &&
          this.program[newRightCoord.y][newRightCoord.x] == colorBlock.color
        ) {
          rightCoord = newRightCoord;
        } else {
          rightFound = true;
        }
      }
    }

    console.log(edge, leftCoord, rightCoord)
  }
}
