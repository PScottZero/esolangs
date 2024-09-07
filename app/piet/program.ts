import { CodelChooser, DirectionPtr } from "./interpreter";

class Coord {
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

type ColorBlock = {
  id: number;
  color: string;
  value: number;
  coords: Set<Coord>;
  boundingCoords: [DirectionPtr, Coord][];
  nextCodel: Map<DirectionPtr, Map<CodelChooser, Coord>>;
  nextColorBlock: Map<DirectionPtr, Map<CodelChooser, number>>;
};

export class PietProgram {
  pixels: string[][];
  width: number;
  height: number;
  colorBlocks: Map<number, ColorBlock>;
  coordToColorBlock: Map<string, number>;

  constructor(pixels: string[][] = [[]]) {
    this.pixels = pixels;
    this.width = pixels[0].length;
    this.height = pixels.length;
    this.colorBlocks = new Map();
    this.coordToColorBlock = new Map();
    this.init();
  }

  init() {
    let blockIdx = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const coord = new Coord(x, y);
        if (this.coordToColorBlock.has(coord.str())) continue;

        const currBlockColor = this.pixels[y][x];

        const colorBlock: ColorBlock = {
          id: blockIdx++,
          color: currBlockColor,
          value: 0,
          coords: new Set(),
          boundingCoords: [],
          nextCodel: new Map(),
          nextColorBlock: new Map(),
        };
        this.colorBlocks.set(colorBlock.id, colorBlock);

        this.findCoords(colorBlock, coord);
        this.findBoundingCoords(colorBlock);

        console.log(colorBlock);
      }
    }
  }

  findCoords(colorBlock: ColorBlock, startCoord: Coord) {
    const exploreQueue: Coord[] = [startCoord];
    while (exploreQueue.length > 0) {
      const coord = exploreQueue.pop()!;

      const inBounds = coord.inBounds(this.width, this.height);
      const visited = this.coordToColorBlock.has(coord.str());
      if (!inBounds || visited) continue;

      if (this.pixels[coord.y][coord.x] === colorBlock.color) {
        colorBlock.value += 1;
        colorBlock.coords.add(coord);
        this.coordToColorBlock.set(coord.str(), colorBlock.id);
        exploreQueue.push(new Coord(coord.x, coord.y - 1));
        exploreQueue.push(new Coord(coord.x, coord.y + 1));
        exploreQueue.push(new Coord(coord.x - 1, coord.y));
        exploreQueue.push(new Coord(coord.x + 1, coord.y));
      }
    }
  }

  findBoundingCoords(colorBlock: ColorBlock) {
    let minXCoord = new Coord(this.width, 0);
    let maxXCoord = new Coord(0, 0);
    let minYCoord = new Coord(0, this.height);
    let maxYCoord = new Coord(0, 0);

    for (const coord of Array.from(colorBlock.coords)) {
      if (coord.x <= minXCoord.x) minXCoord = coord;
      if (coord.x >= maxXCoord.x) maxXCoord = coord;
      if (coord.y <= minYCoord.y) minYCoord = coord;
      if (coord.y >= maxYCoord.y) maxYCoord = coord;
    }

    colorBlock.boundingCoords = [
      [DirectionPtr.Left, minXCoord],
      [DirectionPtr.Right, maxXCoord],
      [DirectionPtr.Up, minYCoord],
      [DirectionPtr.Down, maxYCoord],
    ];
  }

  findColorBlockEdgeBounds(colorBlock: ColorBlock) {
    for (const [dp, coord] of colorBlock.boundingCoords) {
      let nextCoord: Coord;
      switch (dp) {
        case DirectionPtr.Up:
          nextCoord = new Coord(coord.x, coord.y);
          break;
        case DirectionPtr.Right:
          nextCoord = new Coord(coord.x, coord.y);
          break;
        case DirectionPtr.Down:
          nextCoord = new Coord(coord.x, coord.y);
          break;
        case DirectionPtr.Left:
          nextCoord = new Coord(coord.x, coord.y);
          break;
      }
    }
  }
}
