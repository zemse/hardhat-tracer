import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { AwaitedItem, Item, TracerDependencies } from "../types";

import call from "./call";
import create from "./create";
import create2 from "./create2";
import delegatecall from "./delegatecall";
import exception from "./exception";
import extcodehash from "./extcodehash";
import extcodesize from "./extcodesize";
import log from "./log";
import log0 from "./log0";
import log1 from "./log1";
import log2 from "./log2";
import log3 from "./log3";
import log4 from "./log4";
import mload from "./mload";
import msize from "./msize";
import mstore from "./mstore";
import mstore8 from "./mstore8";
import return_ from "./return";
import revert from "./revert";
import selfdestruct from "./selfdestruct";
import sha3 from "./sha3";
import sload from "./sload";
import sstore from "./sstore";
import staticcall from "./staticcall";

export function parse(
  step: MinimalInterpreterStep,
  currentAddress: { value: string }
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
    case "MLOAD":
      return mload.parse(step);
    case "MSIZE":
      return msize.parse();
    case "MSTORE":
      return mstore.parse(step);
    case "MSTORE8":
      return mstore8.parse(step);
    case "SLOAD":
      return sload.parse(step);
    case "SSTORE":
      return sstore.parse(step);
    case "SHA3":
      return sha3.parse(step);
    case "RETURN":
      return return_.parse(step);
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
      return call.format(item, dependencies);
    case "DELEGATECALL":
      return delegatecall.format(item, dependencies);
    case "STATICCALL":
      return staticcall.format(item, dependencies);
    case "CREATE":
      return create.format(item, dependencies);
    case "CREATE2":
      return create2.format(item, dependencies);
    case "EXTCODESIZE":
      return extcodesize.format(item);
    case "EXTCODEHASH":
      return extcodehash.format(item);
    case "LOG0":
    case "LOG1":
    case "LOG2":
    case "LOG3":
    case "LOG4":
      return log.format(item, dependencies);
    case "MLOAD":
      return mload.format(item);
    case "MSIZE":
      return msize.format(item);
    case "MSTORE":
      return mstore.format(item);
    case "MSTORE8":
      return mstore8.format(item);
    case "SLOAD":
      return sload.format(item);
    case "SSTORE":
      return sstore.format(item);
    case "SHA3":
      return sha3.format(item);
    case "REVERT":
      return revert.format(item, dependencies);
    case "SELFDESTRUCT":
      return selfdestruct.format(item);
    case "EXCEPTION":
      return exception.format(item);
    default:
      return item.opcode + " not implemented";
  }
}
