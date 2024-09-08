const RUN_MSG = "### Running...\n\n";
const INPUT_MSG = "### Input:\n\n";
const STOP_MSG = "\n### Stopped.\n";

const MAX_CMDS_MULT = 16;

function inputValid(io: string, prevIO: string): boolean {
  if (io.length <= prevIO.length) return false;
  for (let i = 0; i < prevIO.length; i++) {
    if (io.at(i) !== prevIO.at(i)) return false;
  }
  return true;
}

export abstract class Interpreter {
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Class Vars + Constructor
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  cmdsPerMs: number;

  input: string = "";
  inputPtr: number = 0;

  ioRef: React.RefObject<HTMLTextAreaElement>;
  prevIORef: React.MutableRefObject<string>;

  waitingForInput: boolean = false;
  cliMode: boolean = true;

  running: boolean = false;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
  stopped: boolean = true;

  constructor(
    cmdsPerMs: number,
    ioRef: React.RefObject<HTMLTextAreaElement>,
    prevIORef: React.MutableRefObject<string>,
    setRunning: React.Dispatch<React.SetStateAction<boolean>>,
  ) {
    this.cmdsPerMs = cmdsPerMs;
    this.ioRef = ioRef;
    this.prevIORef = prevIORef;
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

  reset(cliMode: boolean = true) {
    this.input = "";
    this.inputPtr = 0;

    const message = cliMode ? RUN_MSG : INPUT_MSG;
    this.ioRef.current!.value = message;
    this.prevIORef.current = message;

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
    if (this.running) {
      let io = this.ioRef.current!.value;
      let prevIO = this.prevIORef.current;
      if (!inputValid(io, prevIO)) {
        io = this.prevIORef.current;
        this.ioRef.current!.value = io;
      } else if (io.endsWith("\n")) {
        this.prevIORef.current = io;
        this.input = io.substring(prevIO.length);
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
  }

  appendOutput(str: string) {
    this.ioRef.current!.value += str;
    this.prevIORef.current = this.ioRef.current!.value;
    this.ioRef.current!.scrollTop = this.ioRef.current!.scrollHeight;
  }

  appendLineBreak(doubled: boolean = false) {
    const lineBreak = doubled ? "\n\n" : "\n";
    while (!this.ioRef.current!.value.endsWith(lineBreak)) {
      this.appendOutput("\n");
    }
  }
}
