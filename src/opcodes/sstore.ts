import { hexPrefix } from "../utils";
import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { Item } from "../types";

export interface SSTORE {
  key: string;
  value: string;
}

function parse(step: InterpreterStep): Item<SSTORE> {
  return {
    opcode: "SSTORE",
    params: {
      key: hexPrefix(step.stack[step.stack.length - 1].toString(16)),
      value: hexPrefix(step.stack[step.stack.length - 2].toString(16)),
    },
    format(): string {
      return format(this);
    },
  };
}

function format(item: Item<SSTORE>): string {
  return `SSTORE ${item.params.key} <= ${item.params.value}`;
}

export default { parse, format };
