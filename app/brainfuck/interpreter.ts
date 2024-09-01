import { createBytes } from "../utils";

const DATA_SIZE = 0x100000;
const PROG_SIZE = 0x10000;
const INPUT_SIZE = 0x1000;

const OPS_PER_ANIM_REQ = 4096;

const OP_CHARS = [">", "<", "+", "-", ".", ",", "[", "]"];

export class BrainfuckInterpreter {
  data: Uint8Array;
  dataPtr: number;

  prog: Uint8Array;
  progPtr: number;

  input: Uint8Array;
  inputPtr: number;

  outputRef: React.RefObject<HTMLTextAreaElement>;

  running: boolean;
  stopped: boolean;

  constructor(outputRef: React.RefObject<HTMLTextAreaElement>) {
    this.data = createBytes(DATA_SIZE);
    this.dataPtr = 0;

    this.prog = createBytes(PROG_SIZE);
    this.progPtr = 0;

    this.input = createBytes(INPUT_SIZE);
    this.inputPtr = 0;

    this.outputRef = outputRef;

    this.running = false;
    this.stopped = true;
  }

  reset() {
    this.data = createBytes(DATA_SIZE);
    this.dataPtr = 0;

    this.prog = createBytes(PROG_SIZE);
    this.progPtr = 0;

    this.inputPtr = 0;

    this.outputRef.current!.value = "";

    this.running = true;
    this.stopped = false;
  }

  run() {
    for (let i = 0; i < OPS_PER_ANIM_REQ; i++) {
      this.step();
      if (!this.running) {
        console.log("Terminated");
        this.stopped = true;
        return;
      }
    }
    requestAnimationFrame(() => this.run());
  }

  async stop(): Promise<void> {
    this.running = false;
    while (!this.stopped) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
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
    const op = String.fromCharCode(this.prog[this.progPtr]);
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
    if (++this.progPtr >= PROG_SIZE) this.progPtr = 0;
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
    this.outputRef.current!.value += String.fromCharCode(
      this.data[this.dataPtr]
    );
    this.outputRef.current!.scrollTop = this.outputRef.current!.scrollHeight;
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
    let depth = 0;
    const dir = forward ? 1 : -1;
    const bracket = forward ? "[" : "]";
    const otherBracket = forward ? "]" : "[";

    while (this.progPtr >= 0 && this.progPtr < PROG_SIZE) {
      const ch = String.fromCharCode(this.prog[this.progPtr]);
      if (ch === bracket) {
        depth++;
      } else if (ch === otherBracket) {
        if (--depth === 0) return;
      }
      this.progPtr += dir;
    }

    this.progPtr = 0;
  }
}
