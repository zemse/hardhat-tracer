import call from "./call";
import create from "./create";
import create2 from "./create2";
import delegatecall from "./delegatecall";
import extcodesize from "./extcodesize";
import extcodehash from "./extcodehash";
import log0 from "./log0";
import log1 from "./log1";
import log2 from "./log2";
import log3 from "./log3";
import log4 from "./log4";
import revert from "./revert";
import sload from "./sload";
import sstore from "./sstore";
import staticcall from "./staticcall";
import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { TracerDependencies } from "../types";
import log from "./log";
import selfdestruct from "./selfdestruct";
import { AwaitedItem, Item } from "../types";
import exception from "./exception";

export function parse(
  step: InterpreterStep,
  currentAddress: string
): Item<any> | AwaitedItem<any> | undefined {
  switch (step.opcode.name) {
    case "EXTCODESIZE":
      return extcodesize.parse(step);
    case "EXTCODEHASH":
      return extcodehash.parse(step);
    case "LOG0":
      return log0.parse(step, currentAddress);
    case "LOG1":
      return log1.parse(step, currentAddress);
    case "LOG2":
      return log2.parse(step, currentAddress);
    case "LOG3":
      return log3.parse(step, currentAddress);
    case "LOG4":
      return log4.parse(step, currentAddress);
    case "SLOAD":
      return sload.parse(step);
    case "SSTORE":
      return sstore.parse(step);
    case "REVERT":
      return revert.parse(step);
    default:
      return;
  }
}

export async function format(
  item: Item<any>,
  dependencies: TracerDependencies
): Promise<string> {
  switch (item.opcode) {
    case "CALL":
      return await call.format(item, dependencies);
    case "DELEGATECALL":
      return await delegatecall.format(item, dependencies);
    case "STATICCALL":
      return await staticcall.format(item, dependencies);
    case "CREATE":
      return await create.format(item, dependencies);
    case "CREATE2":
      return await create2.format(item, dependencies);
    case "EXTCODESIZE":
      return extcodesize.format(item);
    case "EXTCODEHASH":
      return extcodehash.format(item);
    case "LOG0":
    case "LOG1":
    case "LOG2":
    case "LOG3":
    case "LOG4":
      return await log.format(item, dependencies);
    case "SLOAD":
      return await sload.format(item);
    case "SSTORE":
      return await sstore.format(item);
    case "REVERT":
      return await revert.format(item, dependencies);
    case "SELFDESTRUCT":
      return await selfdestruct.format(item);
    case "EXCEPTION":
      return await exception.format(item);
    default:
      return item.opcode + " not implemented";
  }
}
