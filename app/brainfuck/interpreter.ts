import { Interpreter } from "../interpreter";
import { createBytes } from "../utils";

const DATA_SIZE = 0x10000;
const CMDS_PER_MS = 512;
const CMD_CHARS = [">", "<", "+", "-", ".", ",", "[", "]"];

export class BrainfuckInterpreter extends Interpreter {
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Class Vars + Constructor
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  data: Uint8Array = createBytes(DATA_SIZE);
  dataPtr: number = 0;

  program: string = "";
  progPtr: number = 0;

  constructor(setRunning: (running: boolean) => void) {
    super(CMDS_PER_MS, setRunning);
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Control Flow
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  async run(program: string, cliMode: boolean = true) {
    if (this.running) await this.stop();

    this.data = createBytes(DATA_SIZE);
    this.dataPtr = 0;

    this.program = program;
    this.progPtr = 0;

    this.reset(cliMode);
    this._run();
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

  readCmd(): string {
    while (true) {
      if (this.progPtr >= this.program.length) break;
      const ch = this.program.at(this.progPtr)!;
      if (CMD_CHARS.includes(ch)) return ch;
      this.progPtr++;
    }
    return "";
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Commands
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

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
}
