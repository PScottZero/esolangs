import { createBytes } from "../utils";

const DATA_SIZE = 0x100000;
const PROG_SIZE = 0x10000;
const INPUT_SIZE = 0x1000;

const OPS_PER_ANIM_REQ = 25;

class BrainfuckInterpreter {
  data: Uint8Array;
  dataPtr: number;

  prog: Uint8Array;
  progPtr: number;

  input: Uint8Array;
  inputPtr: number;

  running: boolean;

  constructor() {
    this.data = createBytes(DATA_SIZE);
    this.dataPtr = 0;

    this.prog = createBytes(PROG_SIZE);
    this.progPtr = 0;

    this.input = createBytes(INPUT_SIZE);
    this.inputPtr = 0;

    this.running = false;
  }

  reset() {
    this.dataPtr = 0;
    this.progPtr = 0;
    this.inputPtr = 0;
    this.running = true;
  }

  run() {
    for (let i = 0; i < OPS_PER_ANIM_REQ && this.running; i++) {
      this.step();
      if (!this.running) return;
    }
    requestAnimationFrame(() => this.run());
  }

  ops = new Map<string, () => void>([
    [">", this.incDataPtr],
    ["<", this.decDataPtr],
    ["+", this.incData],
    ["-", this.decData],
    [".", this.out],
    [",", this.in],
    ["[", this.loopStart],
    ["]", this.loopEnd],
  ]);

  step() {
    const op = String.fromCharCode(this.prog[this.progPtr++]);
    if (op in this.ops) {
      this.ops.get(op)!();
    } else {
      console.log(`invalid op: ${op}`);
      this.running = false;
    }
  }

  incDataPtr() {
    this.dataPtr++;
    if (this.dataPtr >= DATA_SIZE) this.dataPtr = 0;
  }

  decDataPtr() {
    this.dataPtr--;
    if (this.dataPtr < 0) this.dataPtr = DATA_SIZE - 1;
  }

  incData() {
    this.data[this.dataPtr]++;
  }

  decData() {
    this.data[this.dataPtr]--;
  }

  out() {
    console.log(String.fromCharCode(this.data[this.dataPtr]));
  }

  in() {
    if (this.inputPtr < INPUT_SIZE) {
      const inByte = this.input[this.inputPtr++];
      this.data[this.dataPtr] = inByte;
    } else {
      console.log("end of input");
      this.running = false;
    }
  }

  loopStart() {
    if (this.data[this.dataPtr] === 0) this.jumpToMatchingBracket();
  }

  loopEnd() {
    if (this.data[this.dataPtr] !== 0) this.jumpToMatchingBracket(false);
  }

  jumpToMatchingBracket(forward: boolean = true) {
    let depth = 1;
    const dir = forward ? 1 : -1;
    const bracket = forward ? "[" : "]";
    const otherBracket = forward ? "]" : "[";

    this.progPtr += forward ? 1 : -2;

    while (this.progPtr >= 0 && this.progPtr < PROG_SIZE) {
      const ch = String.fromCharCode(this.prog[this.progPtr]);
      if (ch === bracket) {
        depth++;
      } else if (ch === otherBracket) {
        depth--;
        if (depth === 0) {
          this.progPtr += 1;
          return;
        }
      }
      this.progPtr += dir;
    }

    this.progPtr = 0;
  }
}
