import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";

import { Item } from "../types";
import {
  colorKey,
  colorLabel,
  colorValue,
  parseBytes32,
  parseHex,
  shallowCopyStack2,
} from "../utils";

export interface MSTORE8 {
  offset: string;
  value: string;
}

function parse(step: InterpreterStep): Item<MSTORE8> {
  const stack = shallowCopyStack2(step.stack);
  if (stack.length < 2) {
    throw new Error("[hardhat-tracer]: Faulty MSTORE");
  }

  const offset = parseHex(stack.pop()!, 4);
  const value = parseHex(stack.pop()!, 1);

  return {
    opcode: "MSTORE8",
    params: {
      offset,
      value,
    },
  };
}

function format(item: Item<MSTORE8>): string {
  return `${colorLabel("[MSTORE8]")} ${colorKey(
    item.params.offset
  )} ← ${colorValue(item.params.value)}`;
}

export default { parse, format };
