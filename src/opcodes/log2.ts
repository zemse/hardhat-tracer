import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { Item } from "../types";
import {
  memorySlice,
  parseBytes32,
  parseNumber,
  shallowCopyStack2,
} from "../utils";

import { LOG } from "./log";

export interface LOG2 extends LOG {
  topics: [string, string];
}

function parse(
  step: MinimalInterpreterStep,
  currentAddress?: { value: string }
): Item<LOG2> {
  if (!currentAddress) {
    throw new Error(
      "[hardhat-tracer]: currentAddress is required for log to be recorded"
    );
  }

  const stack = shallowCopyStack2(step.stack);
  if (stack.length < 4) {
    throw new Error("[hardhat-tracer]: Faulty LOG2");
  }

  const dataOffset = parseNumber(stack.pop()!);
  const dataSize = parseNumber(stack.pop()!);
  const topic0 = parseBytes32(stack.pop()!);
  const topic1 = parseBytes32(stack.pop()!);

  const data = memorySlice(step.memory, dataOffset, dataSize);

  return {
    opcode: "LOG2",
    params: {
      data,
      topics: [topic0, topic1],
      address: currentAddress,
    },
    format(): string {
      throw new Error("[hardhat-tracer]: Not implemented directly");
    },
  };
}

export default { parse };
