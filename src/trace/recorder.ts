import { InterpreterStep } from "@ethereumjs/vm/dist/evm/interpreter";
import Message from "@ethereumjs/vm/dist/evm/message";
import { Transaction } from "@ethereumjs/tx";
import { EVMResult, NewContractEvent } from "@ethereumjs/vm/dist/evm/evm";
import { AfterTxEvent } from "@ethereumjs/vm/dist/runTx";
import { Item, TraceTransaction } from "./transaction";
import VM from "@ethereumjs/vm";
// import { call } from "./opcodes/call";
import { parse } from "./opcodes";
import { STATICCALL } from "./opcodes/staticcall";
import { DELEGATECALL } from "./opcodes/delegatecall";
import { CALL } from "./opcodes/call";
import { CREATE } from "./opcodes/create";
import { hexPrefix } from "../utils";

// const txs: TransactionTrace[] = [];
// let txTrace: TransactionTrace;

export class TraceRecorder {
  previousTraces: TraceTransaction[] = [];
  trace: TraceTransaction | undefined;
  previousOpcode: string | undefined;
  constructor(vm: VM) {
    // this.txTrace = new TransactionTrace("", "", "", 0);
    vm.on("beforeTx", this.handleBeforeTx.bind(this));
    vm.on("beforeMessage", this.handleBeforeMessage.bind(this));
    vm.on("newContract", this.handleNewContract.bind(this));
    vm.on("step", this.handleStep.bind(this));
    vm.on("afterMessage", this.handleAfterMessage.bind(this));
    vm.on("afterTx", this.handleAfterTx.bind(this));
  }

  handleBeforeTx(tx: Transaction, next: () => void) {
    // console.log("handleBeforeTx");

    if (this.trace) {
      // TODO improve these errors
      throw new Error("internal error: trace is defined");
    }

    this.trace = new TraceTransaction();

    next();
  }

  handleBeforeMessage(message: Message, next: () => void) {
    // console.log("handleBeforeMessage");

    if (!this.trace) {
      throw new Error("internal error: trace is undefined");
    }
    let item: Item<any>;
    if (message.isStatic) {
      item = {
        opcode: "STATICCALL",
        params: {
          to: hexPrefix(message.to.toString()),
          inputData: hexPrefix(message.data.toString("hex")),
          gasLimit: message.gasLimit.toNumber(),
        },
        children: [],
      } as Item<STATICCALL>;
    } else if (message.delegatecall) {
      item = {
        opcode: "DELEGATECALL",
        params: {
          to: hexPrefix(message.to.toString()),
          inputData: hexPrefix(message.data.toString("hex")),
          gasLimit: message.gasLimit.toNumber(),
        },
        children: [],
      } as Item<DELEGATECALL>;
    } else if (message.to) {
      item = {
        opcode: "CALL",
        params: {
          to: hexPrefix(message.to.toString()),
          inputData: hexPrefix(message.data.toString("hex")),
          gasLimit: message.gasLimit.toNumber(),
          value: hexPrefix(message.value.toString()),
        },
        children: [],
      } as Item<CALL>;
    } else {
      item = {
        opcode: "CREATE",
        params: {
          initCode: hexPrefix(message.data.toString("hex")),
          gasLimit: message.gasLimit.toNumber(),
          value: hexPrefix(message.value.toString()),
        },
        children: [],
      } as Item<CREATE>;
    }

    this.trace.insertItem(item, { increaseDepth: true });
    next();
  }

  handleNewContract(contract: NewContractEvent, next: () => void) {
    // console.log("handleNewContract");

    // TODO use this to get the contract address and create code

    next();
  }

  handleStep(step: InterpreterStep, next: () => void) {
    // console.log("handleStep");
    if (!this.trace) {
      throw new Error("internal error: trace is undefined");
    }

    const item = parse(step.opcode.name, step);
    if (item) {
      this.trace.insertItem(item);
    }
    // console.log(step.opcode.name);
    // switch (step.opcode.name) {
    //   // case "CALL":
    //   //   this.trace.insertItem(call.parseStep(step));
    //   case "SSTORE":
    //     this.trace.insertItem(sstore.parse(step));
    //     break;
    //   case "RETURN":
    //     console.log("RETURN");
    //     break;
    //   default:
    //     break;
    // }
    this.previousOpcode = step.opcode.name;
    // console.log(step.opcode.name);
    // setTimeout(() => next(), 1);
    next();
  }

  handleAfterMessage(evmResult: EVMResult, next: () => void) {
    // console.log("handleAfterMessage");

    if (!this.trace) {
      throw new Error("internal error: trace is undefined");
    }

    this.trace.returnCurrentCall(
      evmResult.execResult.returnValue.toString("hex")
    );
    next();
  }

  handleAfterTx(_tx: AfterTxEvent, next: () => void) {
    // console.log("handleAfterTx");

    if (!this.trace) {
      throw new Error("internal error: trace is undefined");
    }

    // store the trace for later use (printing or outputting)
    this.previousTraces.push(this.trace);

    // clear the trace
    this.trace = undefined;
    this.previousOpcode = undefined;

    next();
  }
}
