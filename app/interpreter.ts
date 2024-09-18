const RUN_MSG = "### Running...\n\n";
const INPUT_MSG = "### Input:\n\n";
const STOP_MSG = "\n### Stopped.\n";

const MAX_CMDS_MULT = 16;

export abstract class Interpreter {
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Class Vars + Constructor
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  cmdsPerMs: number;

  input: string = "";
  io: string = "";
  inputPtr: number = 0;

  waitingForInput: boolean = false;
  cliMode: boolean = true;

  running: boolean = false;
  stopped: boolean = true;

  ioEl: HTMLTextAreaElement | null = null;
  loadEl: HTMLInputElement | null = null;
  setRunning: (running: boolean) => void;

  constructor(cmdsPerMs: number, setRunning: (running: boolean) => void) {
    this.cmdsPerMs = cmdsPerMs;
    this.setRunning = setRunning;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Control Flow
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  _run(timestamp: number = Date.now()) {
    const now = Date.now();
    const cmdCount = Math.min(
      (now - timestamp) * this.cmdsPerMs,
      this.cmdsPerMs * MAX_CMDS_MULT,
    );
    timestamp = now;

    for (let i = 0; i < cmdCount; i++) {
      if (!this.running) {
        this.stopped = true;
        this.setRunning(false);
        this.appendLineBreak();
        this.appendOutput(STOP_MSG);
        return;
      }
      if (this.waitingForInput) break;
      this.step();
    }

    requestAnimationFrame(() => this._run(timestamp));
  }

  abstract step(): void;

  async stop(): Promise<void> {
    this.running = false;
    while (!this.stopped) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    this.appendOutput("");
  }

  load() {
    this.loadEl!.click();
  }

  reset(cliMode: boolean = true) {
    this.input = "";
    this.inputPtr = 0;

    const message = cliMode ? RUN_MSG : INPUT_MSG;
    this.ioEl!.value = message;
    this.io = message;

    this.waitingForInput = !cliMode;
    this.cliMode = cliMode;

    this.running = true;
    this.setRunning(true);
    this.stopped = false;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Input + Output
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  setInput() {
    if (!this.inputValid()) {
      this.ioEl!.value = this.io;
    } else if (this.ioEl!.value.endsWith("\n")) {
      this.input = this.ioEl!.value.substring(this.io.length);
      this.io = this.ioEl!.value;
      this.inputPtr = 0;

      if (!this.cliMode) {
        this.input = this.input.substring(0, this.input.length - 1) + "\0";
        this.appendLineBreak(true);
        this.appendOutput(RUN_MSG);
      }

      this.waitingForInput = false;

      console.log(`accepted input: ${this.input}`);
    }
  }

  inputValid(): boolean {
    if (this.ioEl!.value.length <= this.io.length) return false;
    for (let i = 0; i < this.io.length; i++) {
      if (this.ioEl!.value.at(i) !== this.io.at(i)) return false;
    }
    return true;
  }

  appendOutput(str: string) {
    this.ioEl!.value += str;
    this.io = this.ioEl!.value;
    this.ioEl!.scrollTop = this.ioEl!.scrollHeight;
  }

  appendLineBreak(doubled: boolean = false) {
    const lineBreak = doubled ? "\n\n" : "\n";
    while (!this.ioEl!.value.endsWith(lineBreak)) {
      this.appendOutput("\n");
    }
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Element Reference Setters
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  setIoEl(ioEl: HTMLTextAreaElement) {
    this.ioEl = ioEl;
  }

  setLoadEl(loadEl: HTMLInputElement) {
    this.loadEl = loadEl;
  }
}
