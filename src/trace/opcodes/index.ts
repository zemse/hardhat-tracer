import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { Item } from "../transaction";

import sstore from "./sstore";
import create from "./create";
import create2 from "./create2";
import call from "./call";
import staticcall from "./staticcall";
import revert from "./revert";
import { TracerDependencies } from "../../types";

export function parse(
  opcode: string,
  step: InterpreterStep
): Item<any> | undefined {
  switch (step.opcode.name) {
    // case "CALL":
    //   this.trace.insertItem(call.parseStep(step));
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
    case "STATICCALL":
      return await staticcall.format(item, dependencies);
    case "CREATE":
      return await create.format(item, dependencies);
    case "CREATE2":
      return await create2.format(item, dependencies);
    case "SSTORE":
      return await sstore.format(item);
    case "REVERT":
      return await revert.format(item, dependencies);
    default:
      return item.opcode + " not implemented";
  }
}
