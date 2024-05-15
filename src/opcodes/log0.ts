import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { Item } from "../types";
import { memorySlice, parseNumber, shallowCopyStack2 } from "../utils";

import { LOG } from "./log";

export interface LOG0 extends LOG {
  topics: [];
}

function parse(
  step: MinimalInterpreterStep,
  currentAddress?: { value: string }
): Item<LOG0> {
  if (!currentAddress) {
    throw new Error(
      "[hardhat-tracer]: currentAddress is required for log to be recorded"
    );
  }

  const stack = shallowCopyStack2(step.stack);
  if (stack.length < 2) {
    throw new Error("[hardhat-tracer]: Faulty LOG0");
  }

  const dataOffset = parseNumber(stack.pop()!);
  const dataSize = parseNumber(stack.pop()!);

  const data = memorySlice(step.memory, dataOffset, dataSize);

  return {
    opcode: "LOG0",
    params: {
      data,
      topics: [],
      address: currentAddress,
    },
    format(): string {
      throw new Error("[hardhat-tracer]: Not implemented directly");
    },
  };
}

export default { parse };
