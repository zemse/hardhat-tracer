import { MinimalEthereumJsVm } from "hardhat/internal/hardhat-network/provider/vm/minimal-vm";
import createDebug from "debug";

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
import {
  MinimalEVMResult,
  MinimalInterpreterStep,
  MinimalMessage,
} from "hardhat/internal/hardhat-network/provider/vm/types";
import { parseExec } from "./utils";
const debug = createDebug("hardhat-tracer:trace-recorder");

export class TraceRecorder {
  public vm: MinimalEthereumJsVm;
  public previousTraces: TransactionTrace[] = [];
  public printIndex = -1;
  public previousTracesMap: Map<string, TransactionTrace> = new Map();
  public trace: TransactionTrace | undefined;
  public previousOpcode: string | undefined;
  public tracerEnv: TracerEnv;
  public awaitedItems: Array<AwaitedItem<any>>;
  public addressStack: { value: string }[]; // object is used to allow lazy assignment to value in CREATE/2

  constructor(vm: MinimalEthereumJsVm, tracerEnv: TracerEnv) {
    this.vm = vm;
    this.tracerEnv = tracerEnv;

    checkIfOpcodesAreValid(tracerEnv.opcodes, vm);

    this.awaitedItems = [];
    this.addressStack = [];

    vm.events.on("beforeTx", this.handleBeforeTx.bind(this));
    vm.evm.events?.on("beforeMessage", this.handleBeforeMessage.bind(this));
    // vm.evm.events?.on("newContract", this.handleNewContract.bind(this));
    vm.evm.events?.on("step", this.handleStep.bind(this));
    vm.evm.events?.on("afterMessage", this.handleAfterMessage.bind(this));
    vm.events.on("afterTx", this.handleAfterTx.bind(this));
  }

  public storeLastTrace(txHash: string) {
    const lastTrace = this.previousTraces[this.previousTraces.length - 1];
    if (lastTrace) {
      this.previousTracesMap.set(txHash.toLowerCase(), lastTrace);
    }
  }

  public getTrace(txHash: string) {
    return this.previousTracesMap.get(txHash.toLowerCase());
  }

  public handleBeforeTx(
    // tx: any, // TypedTransaction,
    resolve?: ((result?: any) => void) | undefined
  ) {
    if (!this.tracerEnv.switch!.verboseEnabled) return resolve?.();
    debug("handleBeforeTx");
    this.trace = new TransactionTrace();
    // this.trace.hash = hexPrefix(Buffer.from(tx.hash()).toString("hex"));

    resolve?.();
  }

  public handleBeforeMessage(
    message: MinimalMessage,
    resolve: ((result?: any) => void) | undefined
  ) {
    if (!this.tracerEnv.switch!.verboseEnabled) return resolve?.();
    debug("handleBeforeMessage");
    if (!this.trace) {
      throw new Error(
        "[hardhat-tracer]: trace is undefined in handleBeforeMessage"
      );
    }
    const isDelegateCall =
      !!message.to &&
      !!message.codeAddress &&
      !message.to.equals(message.codeAddress);

    const isStaticCall = message.isStaticCall;
    const salt = undefined; // TODO

    let item: Item<any>;
    if (isDelegateCall) {
      if (message.to === undefined) {
        throw new Error(
          "[hardhat-tracer]: message.to is undefined in handleBeforeMessage"
        );
      }
      item = {
        opcode: "DELEGATECALL",
        params: {
          from: hexPrefix(message.caller.toString()),
          to: hexPrefix((message.codeAddress ?? message.to).toString()),
          inputData: hexPrefix(Buffer.from(message.data).toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
          value: this.trace.parent?.params.value,
        },
        children: [],
      } as Item<DELEGATECALL>;
      this.addressStack.push(item.params.to);
    } else if (message.to) {
      item = {
        opcode: isStaticCall ? "STATICCALL" : "CALL",
        params: {
          from: hexPrefix(message.caller.toString()),
          to: hexPrefix(message.to.toString()),
          inputData: hexPrefix(Buffer.from(message.data).toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
          value: hexPrefix(message.value.toString(16)),
        },
        children: [],
      } as Item<CALL>;
      this.addressStack.push(item.params.to);
    } else if (message.to === undefined && salt === undefined) {
      item = {
        opcode: "CREATE",
        params: {
          from: hexPrefix(message.caller.toString()),
          initCode: hexPrefix(Buffer.from(message.data).toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
          value: hexPrefix(message.value.toString(16)),
        },
        children: [],
      } as Item<CREATE>;
      this.addressStack.push({ value: "lazy" });
    } else if (message.to === undefined && salt !== undefined) {
      item = {
        opcode: "CREATE2",
        params: {
          from: hexPrefix(message.caller.toString()),
          initCode: hexPrefix(Buffer.from(message.data).toString("hex")),
          gasLimit: Number(message.gasLimit.toString()),
          value: hexPrefix(message.value.toString(16)),
          salt: hexPrefix(Buffer.from(salt).toString("hex")),
        },
        children: [],
      } as Item<CREATE2>;
      this.addressStack.push({ value: "lazy" });
    } else {
      item = {
        opcode: "UNKNOWN_MESSAGE",
        params: {},
        children: [],
      };
      console.error("handleBeforeMessage: message type not handled", message);
    }
    this.trace.insertItem(item, { increaseDepth: true });
    resolve?.();
  }

  // This is now called in handleAfterMessage
  // prev: public handleNewContract(
  newContract(
    contractAddress: string,
    resolve?: ((result?: any) => void) | undefined
  ) {
    if (!this.tracerEnv.switch!.verboseEnabled) return resolve?.();
    debug("handleNewContract %s", contractAddress);
    if (!this.trace || !this.trace.parent) {
      console.error("handleNewContract: trace.parent not present");
    } else {
      switch (this.trace.parent.opcode) {
        case "CREATE":
          const createItem = (this.trace.parent as unknown) as Item<CREATE>;
          createItem.params.deployedAddress = hexPrefix(contractAddress);
          break;
        case "CREATE2":
          const create2Item = (this.trace.parent as unknown) as Item<CREATE2>;
          create2Item.params.deployedAddress = hexPrefix(contractAddress);
          break;
        default:
          console.log(this.trace.parent);

          console.error("handleNewContract: opcode not handled");
          break;
      }
    }

    let ptr = this.addressStack[this.addressStack.length - 1];
    ptr.value = contractAddress;

    resolve?.();
  }

  public handleStep(
    step: MinimalInterpreterStep,
    resolve: ((result?: any) => void) | undefined
  ) {
    if (!this.tracerEnv.switch!.verboseEnabled) return resolve?.();
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
    evmResult: MinimalEVMResult,
    resolve: ((result?: any) => void) | undefined
  ) {
    if (!this.tracerEnv.switch!.verboseEnabled) return resolve?.();
    debug("handleAfterMessage");
    if (!this.trace) {
      throw new Error(
        "[hardhat-tracer]: trace is undefined in handleAfterMessage"
      );
    }

    let { errorStr, isException } = parseExec(evmResult.execResult);
    // TODO add support - not doing for now, will add if needed
    // if (isSelfDestruct) {
    //   const selfdestructs = Object.entries(evmResult.execResult.selfdestruct);
    //   for (const [address, beneficiary] of selfdestructs) {
    //     debug("self destruct %s", address);
    //     this.trace.insertItem({
    //       opcode: "SELFDESTRUCT",
    //       params: {
    //         beneficiary: hexPrefix(beneficiary.toString("hex")),
    //       },
    //     });
    //   }
    // }

    if (isException) {
      debug("exception %s", errorStr);
      this.trace.insertItem({
        opcode: "EXCEPTION",
        params: {
          error: errorStr,
          type: "EvmError",
        },
      } as Item<EXCEPTION>);
    }

    if (evmResult.execResult.contractAddress) {
      this.newContract(evmResult.execResult.contractAddress.toString());
    }

    this.trace.returnCurrentCall(
      hexPrefix(evmResult.execResult.output?.toString("hex") ?? "0x"),
      Number(evmResult?.execResult.executionGasUsed),
      errorStr
    );

    this.addressStack.pop();

    resolve?.();
  }

  public handleAfterTx(
    // _tx: any, // AfterTxEvent,
    resolve?: ((result?: any) => void) | undefined
  ) {
    if (!this.tracerEnv.switch!.verboseEnabled) return resolve?.();
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
