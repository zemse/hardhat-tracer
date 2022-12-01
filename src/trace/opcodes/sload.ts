import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { AwaitedItem, Item, hexPrefix } from "../../utils";

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
  return `SLOAD ${item.params.key} => ${item.params.value}`;
}

export default { parse, format };
