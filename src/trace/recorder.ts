import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { TypedTransaction } from "@nomicfoundation/ethereumjs-tx";
import { EVMResult, Message } from "@nomicfoundation/ethereumjs-evm";
import { Address } from "@nomicfoundation/ethereumjs-util";
import { AfterTxEvent } from "@nomicfoundation/ethereumjs-vm";
import { AwaitedItem, Item, TraceTransaction } from "./transaction";
import { VM } from "@nomicfoundation/ethereumjs-vm";
// import { call } from "./opcodes/call";
import { parse } from "./opcodes";
import { STATICCALL } from "./opcodes/staticcall";
import { DELEGATECALL } from "./opcodes/delegatecall";
import { CALL } from "./opcodes/call";
import { CREATE } from "./opcodes/create";
import {
  applyStateOverrides,
  checkIfOpcodesAreValid,
  hexPrefix,
  isItem,
} from "../utils";
import { CREATE2 } from "./opcodes/create2";
import { TracerEnv } from "../types";
import { Artifacts } from "hardhat/types";

// const txs: TransactionTrace[] = [];
// let txTrace: TransactionTrace;

interface NewContractEvent {
  address: Address;
  code: Buffer;
}

export class TraceRecorder {
  vm: VM;
  previousTraces: TraceTransaction[] = [];
  trace: TraceTransaction | undefined;
  previousOpcode: string | undefined;
  tracerEnv: TracerEnv;
  awaitedItems: AwaitedItem<any>[];
  addressStack: string[];

  constructor(vm: VM, tracerEnv: TracerEnv, artifacts: Artifacts) {
    this.vm = vm;
    this.tracerEnv = tracerEnv;

    checkIfOpcodesAreValid(tracerEnv.opcodes, vm);

    if (tracerEnv.stateOverrides) {
      applyStateOverrides(tracerEnv.stateOverrides, vm, artifacts);
    }

    this.awaitedItems = [];
    this.addressStack = [];

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
      this.addressStack.push(message.to?.toString()!);
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
      this.addressStack.push(message.caller?.toString()!);
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
      this.addressStack.push(message.caller?.toString()!);
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

    this.addressStack.push(contract.address.toString());

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

    if (this.awaitedItems.length) {
      this.awaitedItems = this.awaitedItems.filter(
        (awaitedItems) => awaitedItems.next > 0
      );
      for (const awaitedItem of this.awaitedItems) {
        // console.log("awaitedItem", awaitedItem);

        awaitedItem.next--;
        if (awaitedItem.next === 0) {
          // try {
          const item = awaitedItem.parse(
            step,
            this.addressStack[this.addressStack.length - 1]
          );
          // // console.log({ item });
          this.trace.insertItem(item);
          // } catch {
          //   console.log(step);
          // }
        }
      }
    }

    // console.log(step.opcode.name);
    if (this.tracerEnv.opcodes.get(step.opcode.name)) {
      const result = parse(
        step,
        this.addressStack[this.addressStack.length - 1]
      );
      if (result) {
        if (isItem(result)) {
          this.trace.insertItem(result);
        } else {
          this.awaitedItems.push(result);
        }
      }
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
    // console.log("handleAfterMessage", !evmResult?.execResult?.exceptionError);

    if (!this.trace) {
      throw new Error("internal error: trace is undefined");
    }

    if (evmResult.execResult.selfdestruct) {
      const selfdestructs = Object.entries(evmResult.execResult.selfdestruct);
      for (const [address, beneficiary] of selfdestructs) {
        console.log("selfdestruct");

        // console.log(
        //   "selfdestruct recorded",
        //   address,
        //   hexPrefix(beneficiary.toString("hex"))
        // );

        this.trace.insertItem({
          opcode: "SELFDESTRUCT",
          params: {
            beneficiary: hexPrefix(beneficiary.toString("hex")),
          },
        });
      }
    }

    // this.trace.insertItem({
    //   opcode: "SELFDESTRUCT",
    //   params: {
    //     beneficiary: hexPrefix("1234"),
    //   },
    // });

    this.trace.returnCurrentCall(
      "0x" + evmResult.execResult.returnValue.toString("hex"),
      !evmResult?.execResult?.exceptionError
    );
    this.addressStack.pop();

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
    this.awaitedItems = [];
    this.addressStack = [];

    resolve?.();
  }
}
