import {
  EVMResult,
  InterpreterStep,
  Message,
} from "@nomicfoundation/ethereumjs-evm";
import { TypedTransaction } from "@nomicfoundation/ethereumjs-tx";
import { Address } from "@nomicfoundation/ethereumjs-util";
import { AfterTxEvent, VM } from "@nomicfoundation/ethereumjs-vm";

import { parse } from "./opcodes";
import { CALL } from "./opcodes/call";
import { CREATE } from "./opcodes/create";
import { CREATE2 } from "./opcodes/create2";
import { DELEGATECALL } from "./opcodes/delegatecall";
import { EXCEPTION } from "./opcodes/exception";
import { TransactionTrace } from "./transaction-trace";
import { AwaitedItem, Item, TracerEnv } from "./types";
import { checkIfOpcodesAreValid } from "./utils/check-opcodes";
import { hexPrefix } from "./utils/hex";
import { isItem } from "./utils/item";

import createDebug from "debug";
const debug = createDebug("hardhat-tracer:trace-recorder");

interface NewContractEvent {
  address: Address;
  code: Buffer;
}

export class TraceRecorder {
  public vm: VM;
  public previousTraces: TransactionTrace[] = [];
  public trace: TransactionTrace | undefined;
  public previousOpcode: string | undefined;
  public tracerEnv: TracerEnv;
  public awaitedItems: Array<AwaitedItem<any>>;
  public addressStack: string[];

  constructor(vm: VM, tracerEnv: TracerEnv) {
    this.vm = vm;
    this.tracerEnv = tracerEnv;

    checkIfOpcodesAreValid(tracerEnv.opcodes, vm);

    this.awaitedItems = [];
    this.addressStack = [];

    vm.events.on("beforeTx", this.handleBeforeTx.bind(this));
    vm.evm.events?.on("beforeMessage", this.handleBeforeMessage.bind(this));
    vm.evm.events?.on("newContract", this.handleNewContract.bind(this));
    vm.evm.events?.on("step", this.handleStep.bind(this));
    vm.evm.events?.on("afterMessage", this.handleAfterMessage.bind(this));
    vm.events.on("afterTx", this.handleAfterTx.bind(this));
  }

  public handleBeforeTx(
    tx: TypedTransaction,
    resolve: ((result?: any) => void) | undefined
  ) {
    debug("handleBeforeTx");
    this.trace = new TransactionTrace();
    this.trace.hash = hexPrefix(tx.hash().toString("hex"));

    resolve?.();
  }

  public handleBeforeMessage(
    message: Message,
    resolve: ((result?: any) => void) | undefined
  ) {
    debug("handleBeforeMessage");
    if (!this.trace) {
      throw new Error(
        "[hardhat-tracer]: trace is undefined in handleBeforeMessage"
      );
    }
    let item: Item<any>;
    if (message.delegatecall) {
      if (message.to === undefined) {
        throw new Error(
          "[hardhat-tracer]: message.to is undefined in handleBeforeMessage"
        );
      }
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
      this.addressStack.push(item.params.to);
    } else if (message.to) {
      item = {
        opcode: message.isStatic ? "STATICCALL" : "CALL",
        params: {
          from: hexPrefix(message.caller.toString()),
          to: hexPrefix(message.to.toString()),
          inputData: hexPrefix(message.data.toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
          value: hexPrefix(message.value.toString(16)),
        },
        children: [],
      } as Item<CALL>;
      this.addressStack.push(item.params.to);
    } else if (message.to === undefined && message.salt === undefined) {
      item = {
        opcode: "CREATE",
        params: {
          from: hexPrefix(message.caller.toString()),
          initCode: hexPrefix(message.data.toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
          value: hexPrefix(message.value.toString(16)),
        },
        children: [],
      } as Item<CREATE>;
    } else if (message.to === undefined && message.salt !== undefined) {
      item = {
        opcode: "CREATE2",
        params: {
          from: hexPrefix(message.caller.toString()),
          initCode: hexPrefix(message.data.toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
          value: hexPrefix(message.value.toString(16)),
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

  public handleNewContract(
    contract: NewContractEvent,
    resolve: ((result?: any) => void) | undefined
  ) {
    debug("handleNewContract %s", contract.address.toString());
    if (!this.trace || !this.trace.parent) {
      console.error("handleNewContract: trace.parent not present");
    } else {
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

  public handleStep(
    step: InterpreterStep,
    resolve: ((result?: any) => void) | undefined
  ) {
    // debug("handleStep %s", step.opcode.name);
    if (!this.trace) {
      throw new Error("[hardhat-tracer]: trace is undefined in handleStep");
    }

    if (this.awaitedItems.length) {
      this.awaitedItems = this.awaitedItems.filter(
        (awaitedItems) => awaitedItems.next > 0
      );
      for (const awaitedItem of this.awaitedItems) {
        awaitedItem.next--;
        if (awaitedItem.next === 0) {
          const item = awaitedItem.parse(
            step,
            this.addressStack[this.addressStack.length - 1]
          );
          this.trace.insertItem(item);
        }
      }
    }

    if (
      this.tracerEnv.enableAllOpcodes ||
      this.tracerEnv.opcodes.get(step.opcode.name)
    ) {
      const result = parse(
        step,
        this.addressStack[this.addressStack.length - 1]
      );
      if (result) {
        if (isItem(result)) {
          debug("parsed step %s", step.opcode.name);
          this.trace.insertItem(result);
        } else {
          debug("parsed step awaited %s", step.opcode.name);
          this.awaitedItems.push(result);
        }
      }
    }

    this.previousOpcode = step.opcode.name;

    resolve?.();
  }

  public handleAfterMessage(
    evmResult: EVMResult,
    resolve: ((result?: any) => void) | undefined
  ) {
    debug("handleAfterMessage");
    if (!this.trace) {
      throw new Error(
        "[hardhat-tracer]: trace is undefined in handleAfterMessage"
      );
    }

    if (evmResult.execResult.selfdestruct) {
      const selfdestructs = Object.entries(evmResult.execResult.selfdestruct);
      for (const [address, beneficiary] of selfdestructs) {
        debug("self destruct %s", address);
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
      debug("exception %s", evmResult.execResult.exceptionError.error);
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

  public handleAfterTx(
    _tx: AfterTxEvent,
    resolve: ((result?: any) => void) | undefined
  ) {
    debug("handleAfterTx");
    if (this.tracerEnv.enabled) {
      if (!this.trace) {
        throw new Error(
          "[hardhat-tracer]: trace is undefined in handleAfterTx"
        );
      }

      // store the trace for later use (printing or outputting)
      debug("record the trace");
      this.previousTraces.push(this.trace);
    }

    // clear the trace
    debug("clear running trace data");
    this.trace = undefined;
    this.previousOpcode = undefined;
    this.awaitedItems = [];
    this.addressStack = [];

    resolve?.();
  }
}
