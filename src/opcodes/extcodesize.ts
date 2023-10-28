import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";

import { AwaitedItem, Item } from "../types";
import { colorKey, colorLabel, colorValue, parseAddress } from "../utils";

export interface EXTCODESIZE {
  address: string;
  size: number;
}

function parse(step: InterpreterStep): AwaitedItem<EXTCODESIZE> {
  const address = parseAddress(step.stack[step.stack.length - 1].toString(16));

  const next = 1; // get stack just after this opcode
  return {
    isAwaitedItem: true,
    next,
    parse: (stepNext: InterpreterStep) => ({
      opcode: "EXTCODESIZE",
      params: {
        address,
        size: Number(stepNext.stack[step.stack.length - 1].toString()),
      },
      format(): string {
        let val = this.children?.at(3);
        val?.format?.();
        return format(this);
      },
    }),
  };
}

function format(item: Item<EXTCODESIZE>): string {
  return `${colorLabel("[EXTCODESIZE]")} ${colorKey(
    item.params.address
  )} → ${colorValue(item.params.size.toString())}`;
}

export default { parse, format };
