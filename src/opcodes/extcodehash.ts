import { AwaitedItem, Item } from "../types";
import { parseAddress, parseBytes32 } from "../utils";
import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";

export interface EXTCODEHASH {
  address: string;
  hash: string;
}

function parse(step: InterpreterStep): AwaitedItem<EXTCODEHASH> {
  const address = parseAddress(step.stack[step.stack.length - 1].toString(16));

  const next = 1; // get stack just after this opcode
  return {
    isAwaitedItem: true,
    next,
    parse: (stepNext: InterpreterStep) => ({
      opcode: "EXTCODEHASH",
      params: {
        address,
        hash: parseBytes32(stepNext.stack[step.stack.length - 1].toString(16)),
      },
      format(): string {
        return format(this);
      },
    }),
  };
}

function format(item: Item<EXTCODEHASH>): string {
  return `EXTCODEHASH ${item.params.address} => ${item.params.hash}`;
}

export default { parse, format };
