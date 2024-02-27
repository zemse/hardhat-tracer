import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { AwaitedItem, Item } from "../types";
import { colorLabel, colorMload, colorValue, parseBytes32 } from "../utils";

export interface MLOAD {
  offset: string;
  value: string;
}

function parse(step: MinimalInterpreterStep): AwaitedItem<MLOAD> {
  const offset = parseBytes32(step.stack[step.stack.length - 1].toString(16));

  const next = 1; // get stack just after this opcode
  return {
    isAwaitedItem: true,
    next,
    parse: (stepNext: MinimalInterpreterStep) => ({
      opcode: "MLOAD",
      params: {
        offset,
        value: parseBytes32(
          stepNext.stack[stepNext.stack.length - 1].toString(16)
        ),
      },
      format(): string {
        return format(this);
      },
    }),
  };
}

function format(item: Item<MLOAD>): string {
  return `${colorLabel("[MLOAD]")}  ${colorMload(
    item.params.offset
  )} → ${colorValue(item.params.value)}`;
}

export default { parse, format };
