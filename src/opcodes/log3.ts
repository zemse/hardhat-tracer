import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";

import { Item } from "../types";
import { hexPrefix, parseHex, parseNumber, shallowCopyStack2 } from "../utils";

import { LOG } from "./log";

export interface LOG3 extends LOG {
  topics: [string, string, string];
}

function parse(step: InterpreterStep, currentAddress?: string): Item<LOG3> {
  if (!currentAddress) {
    throw new Error(
      "[hardhat-tracer]: currentAddress is required for log to be recorded"
    );
  }

  const stack = shallowCopyStack2(step.stack);
  if (stack.length < 5) {
    throw new Error("[hardhat-tracer]: Faulty LOG3");
  }

  const dataOffset = parseNumber(stack.pop()!);
  const dataSize = parseNumber(stack.pop()!);
  const topic0 = parseHex(stack.pop()!);
  const topic1 = parseHex(stack.pop()!);
  const topic2 = parseHex(stack.pop()!);

  const data = hexPrefix(
    step.memory.slice(dataOffset, dataOffset + dataSize).toString("hex")
  );

  return {
    opcode: "LOG3",
    params: {
      data,
      topics: [topic0, topic1, topic2],
      address: currentAddress,
    },
    format(): string {
      throw new Error("[hardhat-tracer]: Not implemented directly");
    },
  };
}

export default { parse };
