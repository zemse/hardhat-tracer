import call from "./call";
import create from "./create";
import create2 from "./create2";
import delegatecall from "./delegatecall";
import revert from "./revert";
import sload from "./sload";
import sstore from "./sstore";
import staticcall from "./staticcall";
import { AwaitedItem, Item } from "../transaction";
import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { TracerDependencies } from "../../types";

export function parse(
  opcode: string,
  step: InterpreterStep
): Item<any> | AwaitedItem<any> | undefined {
  switch (step.opcode.name) {
    // case "CALL":
    //   this.trace.insertItem(call.parseStep(step));
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
    case "SLOAD":
      return await sload.format(item);
    case "SSTORE":
      return await sstore.format(item);
    case "REVERT":
      return await revert.format(item, dependencies);
    default:
      return item.opcode + " not implemented";
  }
}
