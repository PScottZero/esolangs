import { PietProgram } from "./program";

export const COLORS = [
  ["#FFC0C0", "#FFFFC0", "#C0FFC0", "#C0FFFF", "#C0C0FF", "#FFC0FF"],
  ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"],
  ["#C00000", "#C0C000", "#00C000", "#00C0C0", "#0000C0", "#C000C0"],
];
export const WHITE = "#FFFFFF";
export const BLACK = "#000000";

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
  directionPtr: DirectionPtr;
  codelChooser: CodelChooser;

  program: PietProgram;
  colorBlockPtr: number;

  constructor() {
    this.directionPtr = DirectionPtr.Right;
    this.codelChooser = CodelChooser.Left;

    this.program = new PietProgram();
    this.colorBlockPtr = 0;
  }

  run(pixels: string[][]) {
    this.directionPtr = DirectionPtr.Right;
    this.codelChooser = CodelChooser.Left;
    this.colorBlockPtr = 0;

    this.program = new PietProgram(pixels);
    this.colorBlockPtr = 0;
  }
}
