import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { AwaitedItem, Item } from "../types";
import { colorLabel, colorSload, colorValue, parseBytes32 } from "../utils";

export interface SLOAD {
  key: string;
  value: string;
}

function parse(step: MinimalInterpreterStep): AwaitedItem<SLOAD> {
  const key = parseBytes32(step.stack[step.stack.length - 1].toString(16));

  const next = 1; // get stack just after this opcode
  return {
    isAwaitedItem: true,
    next,
    parse: (stepNext: MinimalInterpreterStep) => ({
      opcode: "SLOAD",
      params: {
        key,
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

function format(item: Item<SLOAD>): string {
  return `${colorLabel("[SLOAD]")}  ${colorSload(
    item.params.key
  )} → ${colorValue(item.params.value)}`;
}

export default { parse, format };
