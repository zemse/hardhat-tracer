import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { AwaitedItem, Item } from "../types";
import { colorLabel, colorValue, parseBytes32 } from "../utils";

export interface MSIZE {
  size: string;
}

function parse(): AwaitedItem<MSIZE> {
  const next = 1; // get stack just after this opcode
  return {
    isAwaitedItem: true,
    next,
    parse: (stepNext: MinimalInterpreterStep) => ({
      opcode: "MSIZE",
      params: {
        size: parseBytes32(
          stepNext.stack[stepNext.stack.length - 1].toString(16)
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
