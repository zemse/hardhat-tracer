import { AwaitedItem, Item } from "../types";
import { colorKey, colorLabel, colorValue, hexPrefix } from "../utils";
import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";

export interface SLOAD {
  key: string;
  value: string;
}

function parse(step: InterpreterStep): AwaitedItem<SLOAD> {
  const key = hexPrefix(step.stack[step.stack.length - 1].toString(16));

  const next = 1; // get stack just after this opcode
  return {
    isAwaitedItem: true,
    next,
    parse: (stepNext: InterpreterStep) => ({
      opcode: "SLOAD",
      params: {
        key,
        value: hexPrefix(
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
  return `${colorLabel("[SLOAD]")}  ${colorKey(item.params.key)} → ${colorValue(
    item.params.value
  )}`;
}

export default { parse, format };
