import { createBytes } from "../utils";

const DATA_SIZE = 0x10000;
const OPS_PER_ANIM_REQ = 4096;
const OP_CHARS = [">", "<", "+", "-", ".", ",", "[", "]"];

export class BrainfuckInterpreter {
  data: Uint8Array;
  dataPtr: number;

  program: string;
  progPtr: number;

  input: string;
  inputPtr: number;

  ioRef: React.RefObject<HTMLTextAreaElement>;
  prevIoRef: React.MutableRefObject<string>;

  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
  waitingForInput: boolean;
  stopped: boolean;

  constructor(
    ioRef: React.RefObject<HTMLTextAreaElement>,
    prevIoRef: React.MutableRefObject<string>,
    setRunning: React.Dispatch<React.SetStateAction<boolean>>
  ) {
    this.data = createBytes(DATA_SIZE);
    this.dataPtr = 0;

    this.program = "";
    this.progPtr = 0;

    this.input = "";
    this.inputPtr = 0;

    this.ioRef = ioRef;
    this.prevIoRef = prevIoRef;

    this.running = false;
    this.setRunning = setRunning;
    this.waitingForInput = false;
    this.stopped = true;
  }

  async run(program: string) {
    if (this.running) await this.stop();

    this.data = createBytes(DATA_SIZE);
    this.dataPtr = 0;

    this.program = program;
    this.progPtr = 0;

    this.input = "";
    this.inputPtr = 0;

    this.ioRef.current!.value = "";
    this.prevIoRef.current = "";

    this.running = true;
    this.waitingForInput = false;
    this.stopped = false;

    console.log("running");
    this.setRunning(true);
    this._run();
  }

  _run() {
    for (let i = 0; i < OPS_PER_ANIM_REQ; i++) {
      if (this.waitingForInput) break;
      this.step();
      if (!this.running) {
        console.log("stopped");
        this.stopped = true;
        this.setRunning(false);
        return;
      }
    }
    requestAnimationFrame(() => this._run());
  }

  async stop(): Promise<void> {
    this.running = false;
    this.waitingForInput = false;
    while (!this.stopped) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  setInput(input: string) {
    this.input = input;
    this.inputPtr = 0;
    this.waitingForInput = false;
  }

  step() {
    switch (this.readOp()) {
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
        this.openBracket();
        break;
      case "]":
        this.closeBracket();
        break;
      default:
        console.log("end of program");
        this.running = false;
        break;
    }
    if (!this.waitingForInput) this.progPtr++;
  }

  readOp(): string {
    while (true) {
      if (this.progPtr >= this.program.length) break;
      const ch = this.program.at(this.progPtr)!;
      if (OP_CHARS.includes(ch)) return ch;
      this.progPtr++;
    }
    return "";
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
    this.ioRef.current!.value += String.fromCharCode(this.data[this.dataPtr]);
    this.prevIoRef.current = this.ioRef.current!.value;
    this.ioRef.current!.scrollTop = this.ioRef.current!.scrollHeight;
  }

  in() {
    if (this.inputPtr < this.input.length) {
      this.data[this.dataPtr] = this.input.charCodeAt(this.inputPtr++);
    } else {
      console.log("waiting for input");
      this.waitingForInput = true;
    }
  }

  openBracket() {
    if (this.data[this.dataPtr] === 0) this.jumpToMatchingBracket();
  }

  closeBracket() {
    if (this.data[this.dataPtr] !== 0) this.jumpToMatchingBracket(false);
  }

  jumpToMatchingBracket(forward: boolean = true) {
    let depth = 0;
    const dir = forward ? 1 : -1;
    const bracket = forward ? "[" : "]";
    const otherBracket = forward ? "]" : "[";

    while (this.progPtr >= 0 && this.progPtr < this.program.length) {
      const ch = this.program.at(this.progPtr);
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
