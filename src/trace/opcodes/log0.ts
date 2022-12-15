import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { hexPrefix, parseNumber, shallowCopyStack2 } from "../../utils";
import { Item } from "../../utils";
import { LOG } from "./log";

export interface LOG0 extends LOG {
  topics: [];
}

function parse(step: InterpreterStep, currentAddress?: string): Item<LOG0> {
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

  const data = hexPrefix(
    step.memory.slice(dataOffset, dataOffset + dataSize).toString("hex")
  );

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
