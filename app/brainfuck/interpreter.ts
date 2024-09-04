import { createBytes } from "../utils";

const DATA_SIZE = 0x10000;
const CMDS_MER_MS = 4096;
const CMD_CHARS = [">", "<", "+", "-", ".", ",", "[", "]"];
const RUN_MSG = "### Running...\n\n";
const INPUT_MSG = "### Input:\n\n";
const STOP_MSG = "\n### Stopped.\n";

export class BrainfuckInterpreter {
  data: Uint8Array;
  dataPtr: number;

  program: string;
  progPtr: number;

  input: string;
  inputPtr: number;

  ioRef: React.RefObject<HTMLTextAreaElement>;
  prevIORef: React.MutableRefObject<string>;

  waitingForInput: boolean;
  cliMode: boolean;

  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
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
    this.prevIORef = prevIoRef;

    this.waitingForInput = false;
    this.cliMode = true;

    this.running = false;
    this.setRunning = setRunning;
    this.stopped = true;
  }

  async run(program: string, cliMode: boolean = true) {
    if (this.running) await this.stop();

    this.data = createBytes(DATA_SIZE);
    this.dataPtr = 0;

    this.program = program;
    this.progPtr = 0;

    this.input = "";
    this.inputPtr = 0;

    const initialIO = cliMode ? RUN_MSG : INPUT_MSG;
    this.ioRef.current!.value = initialIO;
    this.prevIORef.current = initialIO;

    this.waitingForInput = !cliMode;
    this.cliMode = cliMode;

    this.running = true;
    this.setRunning(true);
    this.stopped = false;

    this._run();
  }

  _run(timestamp: number = Date.now()) {
    const now = Date.now();
    const cmdCount = (now - timestamp) * CMDS_MER_MS;
    timestamp = now;

    for (let i = 0; i < cmdCount; i++) {
      if (this.waitingForInput) break;
      this.step();
      if (!this.running) {
        this.stopped = true;
        this.setRunning(false);
        this.appendLineBreak();
        this.appendOutput(STOP_MSG);
        return;
      }
    }

    requestAnimationFrame(() => this._run(timestamp));
  }

  async stop(): Promise<void> {
    this.running = false;
    this.waitingForInput = false;
    while (!this.stopped) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  step() {
    switch (this.readCmd()) {
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
        this.running = false;
        break;
    }
    if (!this.waitingForInput) this.progPtr++;
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
    this.appendOutput(String.fromCharCode(this.data[this.dataPtr]));
  }

  in() {
    if (this.inputPtr < this.input.length) {
      this.data[this.dataPtr] = this.input.charCodeAt(this.inputPtr++);
    } else if (this.cliMode) {
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

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Input + Output
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  readCmd(): string {
    while (true) {
      if (this.progPtr >= this.program.length) break;
      const ch = this.program.at(this.progPtr)!;
      if (CMD_CHARS.includes(ch)) return ch;
      this.progPtr++;
    }
    return "";
  }

  setInput(input: string) {
    this.input = input;
    this.inputPtr = 0;

    if (!this.cliMode) {
      this.input = this.input.substring(0, this.input.length - 1) + '\0';
      this.appendLineBreak(true);
      this.appendOutput(RUN_MSG);
    }

    this.waitingForInput = false;
  }

  appendOutput(str: string) {
    this.ioRef.current!.value += str;
    this.prevIORef.current = this.ioRef.current!.value;
    this.ioRef.current!.scrollTop = this.ioRef.current!.scrollHeight;
  }

  appendLineBreak(doubled: boolean = false) {
    const lineBreak = doubled ? '\n\n' : '\n';
    while (!this.ioRef.current!.value.endsWith(lineBreak)) {
      this.appendOutput("\n");
    }
  }
}
