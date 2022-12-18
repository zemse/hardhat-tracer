import { Address } from "@nomicfoundation/ethereumjs-util";
import { AfterTxEvent } from "@nomicfoundation/ethereumjs-vm";
import { AwaitedItem, Item } from "./types";
import { CALL } from "./opcodes/call";
import { checkIfOpcodesAreValid } from "./utils/check-opcodes";
import { CREATE } from "./opcodes/create";
import { CREATE2 } from "./opcodes/create2";
import { DELEGATECALL } from "./opcodes/delegatecall";
import { EVMResult, Message } from "@nomicfoundation/ethereumjs-evm";
import { EXCEPTION } from "./opcodes/exception";
import { hexPrefix } from "./utils/hex";
import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { isItem } from "./utils/item";
import { parse } from "./opcodes";
import { STATICCALL } from "./opcodes/staticcall";
import { TracerEnv } from "./types";
import { TransactionTrace } from "./transaction-trace";
import { TypedTransaction } from "@nomicfoundation/ethereumjs-tx";
import { VM } from "@nomicfoundation/ethereumjs-vm";

interface NewContractEvent {
  address: Address;
  code: Buffer;
}

export class TraceRecorder {
  vm: VM;
  previousTraces: TransactionTrace[] = [];
  trace: TransactionTrace | undefined;
  previousOpcode: string | undefined;
  tracerEnv: TracerEnv;
  awaitedItems: AwaitedItem<any>[];
  addressStack: string[];

  constructor(vm: VM, tracerEnv: TracerEnv) {
    this.vm = vm;
    this.tracerEnv = tracerEnv;

    checkIfOpcodesAreValid(tracerEnv.opcodes, vm);

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

    // TODO check why sometimes trace is defined
    // if (this.trace) {
    //   // TODO improve these errors
    //   throw new Error("[hardhat-tracer]: trace is defined in handleBeforeTx");
    // }

    this.trace = new TransactionTrace();

    resolve?.();
  }

  handleBeforeMessage(
    message: Message,
    resolve: ((result?: any) => void) | undefined
  ) {
    // if (!this.tracerEnv.enabled) resolve?.();
    // console.log("handleBeforeMessage");

    if (!this.trace) {
      throw new Error(
        "[hardhat-tracer]: trace is undefined in handleBeforeMessage"
      );
    }
    let item: Item<any>;
    if (message.isStatic) {
      if (message.to === undefined) {
        throw new Error(
          "[hardhat-tracer]: message.to is undefined in handleBeforeMessage"
        );
      }
      this.addressStack.push(message.to?.toString()!);
      item = {
        opcode: "STATICCALL",
        params: {
          from: hexPrefix(message.caller.toString()),
          to: hexPrefix(message.to.toString()),
          inputData: hexPrefix(message.data.toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
        },
        children: [],
      } as Item<STATICCALL>;
    } else if (message.delegatecall) {
      if (message.to === undefined) {
        throw new Error(
          "[hardhat-tracer]: message.to is undefined in handleBeforeMessage"
        );
      }
      this.addressStack.push(message.caller?.toString()!);
      item = {
        opcode: "DELEGATECALL",
        params: {
          from: hexPrefix(message.caller.toString()),
          to: hexPrefix((message._codeAddress ?? message.to).toString()),
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
          from: hexPrefix(message.caller.toString()),
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
          from: hexPrefix(message.caller.toString()),
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
          from: hexPrefix(message.caller.toString()),
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
    // if (!this.tracerEnv.enabled) resolve?.();
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
    // if (!this.tracerEnv.enabled) resolve?.();
    // console.log("handleStep");
    if (!this.trace) {
      throw new Error("[hardhat-tracer]: trace is undefined in handleStep");
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
          // console.log({ item });
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
    // if (!this.tracerEnv.enabled) resolve?.();
    // console.log("handleAfterMessage", !evmResult?.execResult?.exceptionError);

    if (!this.trace) {
      throw new Error(
        "[hardhat-tracer]: trace is undefined in handleAfterMessage"
      );
    }

    if (evmResult.execResult.selfdestruct) {
      const selfdestructs = Object.entries(evmResult.execResult.selfdestruct);
      for (const [address, beneficiary] of selfdestructs) {
        // console.log("selfdestruct");

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

    if (
      evmResult?.execResult.exceptionError &&
      evmResult.execResult.exceptionError.error !== "revert"
    ) {
      this.trace.insertItem({
        opcode: "EXCEPTION",
        params: {
          error: evmResult.execResult.exceptionError.error,
          type: evmResult.execResult.exceptionError.errorType,
        },
      } as Item<EXCEPTION>);
    }

    this.trace.returnCurrentCall(
      "0x" + evmResult.execResult.returnValue.toString("hex"),
      Number(evmResult?.execResult.executionGasUsed),
      evmResult?.execResult.exceptionError
    );
    this.addressStack.pop();

    resolve?.();
  }

  handleAfterTx(
    _tx: AfterTxEvent,
    resolve: ((result?: any) => void) | undefined
  ) {
    // console.log("handleAfterTx");

    if (this.tracerEnv.enabled) {
      if (!this.trace) {
        throw new Error(
          "[hardhat-tracer]: trace is undefined in handleAfterTx"
        );
      }

      // store the trace for later use (printing or outputting)
      this.previousTraces.push(this.trace);
    }

    // clear the trace
    this.trace = undefined;
    this.previousOpcode = undefined;
    this.awaitedItems = [];
    this.addressStack = [];

    resolve?.();
  }
}
