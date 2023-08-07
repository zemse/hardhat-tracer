import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";

import { AwaitedItem, Item } from "../types";
import {
  colorKey,
  colorLabel,
  colorValue,
  parseBytes32,
  parseHex,
} from "../utils";

export interface MLOAD {
  offset: string;
  value: string;
}

function parse(step: InterpreterStep): AwaitedItem<MLOAD> {
  const offset = parseHex(step.stack[step.stack.length - 1].toString(16), 4);

  const next = 1; // get stack just after this opcode
  return {
    isAwaitedItem: true,
    next,
    parse: (stepNext: InterpreterStep) => ({
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
  return `${colorLabel("[MLOAD]")}  ${colorKey(
    item.params.offset
  )} → ${colorValue(item.params.value)}`;
}

export default { parse, format };
