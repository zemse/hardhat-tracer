import { InterpreterStep } from "@ethereumjs/vm/dist/evm/interpreter";
import { hexPrefix } from "../../utils";
import { Item } from "../transaction";

export interface SSTORE {
  key: string;
  value: string;
}

function parse(step: InterpreterStep): Item<SSTORE> {
  return {
    opcode: "SSTORE",
    params: {
      key: hexPrefix(step.stack[0].toString()),
      value: hexPrefix(step.stack[1].toString()),
    },
    format(): string {
      return format(this);
    },
  };
}

function format(item: Item<SSTORE>): string {
  return `SSTORE ${item.params.key} ${item.params.value}`;
}

export default { parse, format };
