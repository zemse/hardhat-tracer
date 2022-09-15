import { InterpreterStep } from "@ethereumjs/vm/dist/evm/interpreter";
import { Item } from "../transaction";

import sstore from "./sstore";
import create from "./create";

export function parse(
  opcode: string,
  step: InterpreterStep
): Item<any> | undefined {
  switch (step.opcode.name) {
    // case "CALL":
    //   this.trace.insertItem(call.parseStep(step));
    case "SSTORE":
      return sstore.parse(step);
    default:
      return;
  }
}

export function format(item: Item<any>): string {
  switch (item.opcode) {
    // case "CALL":
    //   this.trace.insertItem(call.parseStep(step));
    case "CREATE":
      return create.format(item);
    case "SSTORE":
      return sstore.format(item);
    default:
      return item.opcode + " not implemented";
  }
}
