import { createBytes } from "../utils";

const DATA_SIZE = 0x100000;
const PROG_SIZE = 0x10000;
const INPUT_SIZE = 0x1000;

const OPS_PER_ANIM_REQ = 2048;

const OP_CHARS = [">", "<", "+", "-", ".", ",", "[", "]"];

export class BrainfuckInterpreter {
  data: Uint8Array;
  dataPtr: number;

  prog: Uint8Array;
  progPtr: number;

  input: Uint8Array;
  inputPtr: number;

  output: string;
  setOutput: (output: string) => void;

  running: boolean;

  constructor(setOutput: (output: string) => void) {
    this.data = createBytes(DATA_SIZE);
    this.dataPtr = 0;

    this.prog = createBytes(PROG_SIZE);
    this.progPtr = 0;

    this.input = createBytes(INPUT_SIZE);
    this.inputPtr = 0;

    this.output = "";
    this.setOutput = setOutput;

    this.running = false;
  }

  reset() {
    this.data = createBytes(DATA_SIZE);
    this.dataPtr = 0;

    this.prog = createBytes(PROG_SIZE);
    this.progPtr = 0;

    this.inputPtr = 0;

    this.output = "";

    this.running = true;
  }

  run() {
    for (let i = 0; i < OPS_PER_ANIM_REQ; i++) {
      this.step();
      if (!this.running) {
        console.log("Terminated");
        return;
      }
    }
    requestAnimationFrame(() => this.run());
  }

  load(programText: string, inputText: string) {
    this.reset();

    for (const ch of programText) {
      if (OP_CHARS.includes(ch) && this.progPtr < PROG_SIZE) {
        this.prog[this.progPtr++] = ch.charCodeAt(0);
      }
    }
    this.progPtr = 0;

    for (const ch of inputText) {
      const chCode = ch.charCodeAt(0);
      if (chCode < 256) {
        this.input[this.inputPtr++] = chCode;
      }
    }
    this.inputPtr = 0;
  }

  step() {
    const op = String.fromCharCode(this.prog[this.progPtr++]);
    switch (op) {
      case ">":
        this.incDataPtr();
        break;
      case "<":
        this.decDataPtr();
        break;
      case "+":
        this.incData();
        break;
      case "-":
        this.decData();
        break;
      case ".":
        this.out();
        break;
      case ",":
        this.in();
        break;
      case "[":
        this.loopStart();
        break;
      case "]":
        this.loopEnd();
        break;
      default:
        console.log(`invalid op: ${op}`);
        this.running = false;
        break;
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
    this.output += String.fromCharCode(this.data[this.dataPtr]);
    this.setOutput(this.output);
  }

  in() {
    if (this.inputPtr < INPUT_SIZE) {
      this.data[this.dataPtr] = this.input[this.inputPtr++];
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

    this.progPtr += forward ? 0 : -2;

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
