import { Interpreter } from "../interpreter";

const HEAP_SIZE = 0x10000;
const CMDS_PER_MS = 512;
const PROG_CHARS = [" ", "\t", "\n"];

const STACK_IMP = " ";
const PUSH_OP = " ";
const DUPL_OP = "\n ";
const COPY_OP = "\t ";
const SWAP_OP = "\n\t";
const DISC_OP = "\n\n";
const SLIDE_OP = "\t\n";

const ARITH_IMP = "\t ";
const ADD_OP = "  ";
const SUB_OP = " \t";
const MULT_OP = " \n";
const DIV_OP = "\t ";
const MOD_OP = "\t\t";

const HEAP_IMP = "\t\t";
const STORE_OP = " ";
const RETRV_OP = "\t";

const FLOW_IMP = "\n";
const MARK_OP = "  ";
const CALL_OP = " \t";
const JUMP_OP = " \n";
const JUMP_ZERO_OP = "\t ";
const JUMP_NEG_OP = "\t\t";
const RET_OP = "\t\n";
const END_OP = "\n\n";

const IO_IMP = "\t\n";
const OUT_CHAR_OP = "  ";
const OUT_NUM_OP = " \t";
const READ_CHAR_OP = "\t ";
const READ_NUM_OP = "\t\t";

const IMPS = [STACK_IMP, ARITH_IMP, HEAP_IMP, FLOW_IMP, IO_IMP];

const INSTRS_WITH_PARAM = [
  STACK_IMP + PUSH_OP,
  STACK_IMP + COPY_OP,
  STACK_IMP + SLIDE_OP,
  FLOW_IMP + MARK_OP,
  FLOW_IMP + CALL_OP,
  FLOW_IMP + JUMP_OP,
  FLOW_IMP + JUMP_ZERO_OP,
  FLOW_IMP + JUMP_NEG_OP,
];

export class WhitespaceInterpreter extends Interpreter {
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Class Vars + Constructor
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  stack: number[] = [];

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

    this.stack = [];

    this.program = program;
    this.progPtr = 0;

    this.reset(cliMode);
    this._run();
  }

  step() {
    const [imp, op, param] = this.readCmd();

    switch (imp) {
      case STACK_IMP:
        this.stackImp(op, param);
        break;
      case ARITH_IMP:
        this.arithmeticImp(op);
        break;
      case HEAP_IMP:
        this.heapImp(op);
        break;
      case FLOW_IMP:
        this.flowControlImp(op);
        break;
      case IO_IMP:
        this.ioImp(op);
        break;
      default:
        this.running = false;
        break;
    }
    // if (!this.waitingForInput) this.progPtr++;
  }

  readCmd(): [string, string, string] {
    const imp = this.readImp();
    const op = this.readOp(imp);
    const param = this.readParam(imp, op);
    return [imp, op, param];
  }

  readImp(): string {
    let imp = "";
    while (!(IMPS.includes(imp) || this.eof())) {
      imp += this.readProgChar();
    }
    return imp;
  }

  readOp(imp: string): string {
    let [opCh1, opCh2] = ["", ""];
    switch (imp) {
      case STACK_IMP:
        opCh1 = this.readProgChar();
        if (opCh1 !== " ") opCh2 = this.readProgChar();
        break;
      case HEAP_IMP:
        opCh1 = this.readProgChar();
        break;
      case ARITH_IMP:
      case FLOW_IMP:
      case IO_IMP:
        opCh1 = this.readProgChar();
        opCh2 = this.readProgChar();
        break;
    }
    return opCh1 + opCh2;
  }

  readParam(imp: string, op: string): string {
    if (!INSTRS_WITH_PARAM.includes(imp + op)) return "";

    let param = "";
    while (!(param.endsWith("\n") || this.eof())) {
      param += this.readProgChar();
    }
    return param.trim();
  }

  readProgChar(): string {
    while (!(PROG_CHARS.includes(this.program[this.progPtr]) || this.eof())) {
      this.progPtr++;
    }
    return this.program.at(this.progPtr++) ?? "";
  }

  eof(): boolean {
    return this.progPtr >= this.program.length;
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Instruction Modification Parameters
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  stackImp(op: string, param: string) {
    switch (op) {
      case PUSH_OP:
        this.push(this.parseNumber(param));
        break;
      case DUPL_OP:
        this.duplicate();
        break;
      case COPY_OP:
        this.copy(this.parseNumber(param));
        break;
      case SWAP_OP:
        this.swap();
        break;
      case DISC_OP:
        this.discard();
        break;
      case SLIDE_OP:
        this.slide(this.parseNumber(param));
        break;
    }
  }

  arithmeticImp(op: string) {
    switch (op) {
      case ADD_OP:
        this.add();
        break;
      case SUB_OP:
        this.subtract();
        break;
      case MULT_OP:
        this.multiply();
        break;
      case DIV_OP:
        this.divide();
        break;
      case MOD_OP:
        this.mod();
        break;
    }
  }

  heapImp(op: string) {
    switch (op) {
      case " ":
        break;
      case "\t":
        break;
    }
  }

  flowControlImp(op: string) {
    switch (op) {
      case "  ":
        break;
      case " \t":
        break;
      case " \n":
        break;
      case "\t ":
        break;
      case "\t\t":
        break;
      case "\t\n":
        break;
      case "\n\n":
        break;
    }
  }

  ioImp(op: string) {
    switch (op) {
      case "  ":
        break;
      case " \t":
        break;
      case "\t ":
        break;
      case "\t\t":
        break;
    }
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Stack Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  push(value: number) {
    this.stack.push(value);
  }

  duplicate() {
    this.stack.push(this.stack[this.stack.length - 1]);
  }

  copy(n: number) {
    if (n < this.stack.length) this.stack.push(this.stack[n]);
  }

  swap() {
    const temp = this.stack[this.stack.length - 1];
    this.stack[this.stack.length - 1] = this.stack[this.stack.length - 2];
    this.stack[this.stack.length - 2] = temp;
  }

  discard() {
    this.stack.pop();
  }

  slide(n: number) {
    // TODO
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Arithmetic Instructions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  add() {
    const r = this.stack.pop() ?? 0;
    const l = this.stack.pop() ?? 0;
    this.stack.push(r + l);
  }

  subtract() {
    const r = this.stack.pop() ?? 0;
    const l = this.stack.pop() ?? 0;
    this.stack.push(r - l);
  }

  multiply() {
    const r = this.stack.pop() ?? 0;
    const l = this.stack.pop() ?? 0;
    this.stack.push(r * l);
  }

  divide() {
    const r = this.stack.pop() ?? 0;
    const l = this.stack.pop() ?? 0;
    if (l !== 0) this.stack.push(Math.floor(r / l));
  }

  mod() {
    const r = this.stack.pop() ?? 0;
    const l = this.stack.pop() ?? 0;
    if (l !== 0) this.stack.push(((r % l) + l) % l);
  }

  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // Helper Functions
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  parseNumber(num: string): number {
    const isPos = num[0] === " " ? true : false;
    const mag = num.substring(1).trim();
    for (let i = 0; i < mag.length; i++) {}
  }
}
