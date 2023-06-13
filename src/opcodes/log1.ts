import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";

import { Item } from "../types";
import {
  hexPrefix,
  parseBytes32,
  parseNumber,
  shallowCopyStack2,
} from "../utils";

import { LOG } from "./log";

export interface LOG1 extends LOG {
  topics: [string];
}

function parse(step: InterpreterStep, currentAddress?: string): Item<LOG1> {
  if (!currentAddress) {
    throw new Error(
      "[hardhat-tracer]: currentAddress is required for log to be recorded"
    );
  }

  const stack = shallowCopyStack2(step.stack);
  if (stack.length < 3) {
    throw new Error("[hardhat-tracer]: Faulty LOG1");
  }

  const dataOffset = parseNumber(stack.pop()!);
  const dataSize = parseNumber(stack.pop()!);
  const topic0 = parseBytes32(stack.pop()!);

  const data = hexPrefix(
    step.memory.slice(dataOffset, dataOffset + dataSize).toString("hex")
  );

  return {
    opcode: "LOG1",
    params: {
      data,
      topics: [topic0],
      address: currentAddress,
    },
    format(): string {
      throw new Error("[hardhat-tracer]: Not implemented directly");
    },
  };
}

export default { parse };
