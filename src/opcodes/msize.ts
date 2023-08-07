import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";

import { AwaitedItem, Item } from "../types";
import {
  colorKey,
  colorLabel,
  colorValue,
  parseBytes32,
  parseHex,
} from "../utils";

export interface MSIZE {
  size: string;
}

function parse(): AwaitedItem<MSIZE> {
  const next = 1; // get stack just after this opcode
  return {
    isAwaitedItem: true,
    next,
    parse: (stepNext: InterpreterStep) => ({
      opcode: "MSIZE",
      params: {
        size: parseHex(
          stepNext.stack[stepNext.stack.length - 1].toString(16),
          4
        ),
      },
      format(): string {
        return format(this);
      },
    }),
  };
}

function format(item: Item<MSIZE>): string {
  return `${colorLabel("[MSIZE]")} ${colorValue(item.params.size)}`;
}

export default { parse, format };
