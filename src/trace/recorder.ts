import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { TypedTransaction } from "@nomicfoundation/ethereumjs-tx";
import { EVMResult, Message } from "@nomicfoundation/ethereumjs-evm";
import { Address } from "@nomicfoundation/ethereumjs-util";
import { AfterTxEvent } from "@nomicfoundation/ethereumjs-vm";
import { Item, TraceTransaction } from "./transaction";
import { VM } from "@nomicfoundation/ethereumjs-vm";
// import { call } from "./opcodes/call";
import { parse } from "./opcodes";
import { STATICCALL } from "./opcodes/staticcall";
import { DELEGATECALL } from "./opcodes/delegatecall";
import { CALL } from "./opcodes/call";
import { CREATE } from "./opcodes/create";
import { hexPrefix } from "../utils";
import { CREATE2 } from "./opcodes/create2";

// const txs: TransactionTrace[] = [];
// let txTrace: TransactionTrace;

interface NewContractEvent {
  address: Address;
  code: Buffer;
}

export class TraceRecorder {
  previousTraces: TraceTransaction[] = [];
  trace: TraceTransaction | undefined;
  previousOpcode: string | undefined;
  constructor(vm: VM) {
    // this.txTrace = new TransactionTrace("", "", "", 0);
    vm.events.on("beforeTx", this.handleBeforeTx.bind(this));
    vm.evm.events?.on("beforeMessage", this.handleBeforeMessage.bind(this));
    vm.evm.events?.on("newContract", this.handleNewContract.bind(this));
    vm.evm.events?.on("step", this.handleStep.bind(this));
    vm.evm.events?.on("afterMessage", this.handleAfterMessage.bind(this));
    vm.events.on("afterTx", this.handleAfterTx.bind(this));
  }

  handleBeforeTx(
    tx: TypedTransaction,
    resolve: ((result?: any) => void) | undefined
  ) {
    // console.log("handleBeforeTx");

    if (this.trace) {
      // TODO improve these errors
      throw new Error("internal error: trace is defined");
    }

    this.trace = new TraceTransaction();

    resolve?.();
  }

  handleBeforeMessage(
    message: Message,
    resolve: ((result?: any) => void) | undefined
  ) {
    // console.log("handleBeforeMessage");

    if (!this.trace) {
      throw new Error("internal error: trace is undefined");
    }
    let item: Item<any>;
    if (message.isStatic) {
      if (message.to === undefined) {
        throw new Error("internal error: message.to is undefined");
      }
      item = {
        opcode: "STATICCALL",
        params: {
          to: hexPrefix(message.to.toString()),
          inputData: hexPrefix(message.data.toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
        },
        children: [],
      } as Item<STATICCALL>;
    } else if (message.delegatecall) {
      if (message.to === undefined) {
        throw new Error("internal error: message.to is undefined");
      }
      item = {
        opcode: "DELEGATECALL",
        params: {
          to: hexPrefix(message.to.toString()),
          inputData: hexPrefix(message.data.toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
        },
        children: [],
      } as Item<DELEGATECALL>;
    } else if (message.to) {
      item = {
        opcode: "CALL",
        params: {
          to: hexPrefix(message.to.toString()),
          inputData: hexPrefix(message.data.toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
          value: hexPrefix(message.value.toString()),
        },
        children: [],
      } as Item<CALL>;
    } else if (message.to == undefined && message.salt == undefined) {
      item = {
        opcode: "CREATE",
        params: {
          initCode: hexPrefix(message.data.toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
          value: hexPrefix(message.value.toString()),
        },
        children: [],
      } as Item<CREATE>;
    } else if (message.to == undefined && message.salt != undefined) {
      item = {
        opcode: "CREATE2",
        params: {
          initCode: hexPrefix(message.data.toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
          value: hexPrefix(message.value.toString()),
          salt: hexPrefix(message.salt.toString("hex")),
        },
        children: [],
      } as Item<CREATE2>;
    } else {
      item = {
        opcode: "UNKNOWN",
        params: {},
        children: [],
      };
      console.error("handleBeforeMessage: message type not handled", message);
    }

    this.trace.insertItem(item, { increaseDepth: true });
    resolve?.();
  }

  handleNewContract(
    contract: NewContractEvent,
    resolve: ((result?: any) => void) | undefined
  ) {
    // console.log("handleNewContract");

    if (!this.trace || !this.trace.parent) {
      console.error("handleNewContract: trace.parent not present");
    } else {
      if (["CREATE", "CREATE2"].includes(this.trace.parent.opcode ?? "")) {
        this.trace.parent.params;
      }

      switch (this.trace.parent.opcode) {
        case "CREATE":
          const createItem = (this.trace.parent as unknown) as Item<CREATE>;
          createItem.params.deployedAddress = hexPrefix(
            contract.address.toString()
          );
          break;
        case "CREATE2":
          const create2Item = (this.trace.parent as unknown) as Item<CREATE2>;
          create2Item.params.deployedAddress = hexPrefix(
            contract.address.toString()
          );
          break;
        default:
          console.log(this.trace.parent);

          console.error("handleNewContract: opcode not handled");
          break;
      }
    }

    resolve?.();
  }

  handleStep(
    step: InterpreterStep,
    resolve: ((result?: any) => void) | undefined
  ) {
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
    resolve?.();
  }

  handleAfterMessage(
    evmResult: EVMResult,
    resolve: ((result?: any) => void) | undefined
  ) {
    // console.log("handleAfterMessage");

    if (!this.trace) {
      throw new Error("internal error: trace is undefined");
    }

    this.trace.returnCurrentCall(
      evmResult.execResult.returnValue.toString("hex")
    );
    resolve?.();
  }

  handleAfterTx(
    _tx: AfterTxEvent,
    resolve: ((result?: any) => void) | undefined
  ) {
    // console.log("handleAfterTx");

    if (!this.trace) {
      throw new Error("internal error: trace is undefined");
    }

    // store the trace for later use (printing or outputting)
    this.previousTraces.push(this.trace);

    // clear the trace
    this.trace = undefined;
    this.previousOpcode = undefined;

    resolve?.();
  }
}
