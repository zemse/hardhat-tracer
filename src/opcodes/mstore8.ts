import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { Item } from "../types";
import {
  colorLabel,
  colorMstore,
  colorValue,
  parseBytes32,
  shallowCopyStack2,
} from "../utils";

export interface MSTORE8 {
  offset: string;
  value: string;
}

function parse(step: MinimalInterpreterStep): Item<MSTORE8> {
  const stack = shallowCopyStack2(step.stack);
  if (stack.length < 2) {
    throw new Error("[hardhat-tracer]: Faulty MSTORE");
  }

  const offset = parseBytes32(stack.pop()!);
  const value = parseBytes32(stack.pop()!);

  return {
    opcode: "MSTORE8",
    params: {
      offset,
      value,
    },
  };
}

function format(item: Item<MSTORE8>): string {
  return `${colorLabel("[MSTORE8]")} ${colorMstore(
    item.params.offset
  )} ← ${colorValue(item.params.value)}`;
}

export default { parse, format };
