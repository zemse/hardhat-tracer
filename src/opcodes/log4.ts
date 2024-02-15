import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { hexZeroPad } from "ethers/lib/utils";

import { Item } from "../types";
import {
  hexPrefix,
  parseBytes32,
  parseNumber,
  shallowCopyStack2,
} from "../utils";

import { LOG } from "./log";

export interface LOG4 extends LOG {
  topics: [string, string, string, string];
}

function parse(step: InterpreterStep, currentAddress?: string): Item<LOG4> {
  if (!currentAddress) {
    throw new Error(
      "[hardhat-tracer]: currentAddress is required for log to be recorded"
    );
  }

  const stack = shallowCopyStack2(step.stack);
  if (stack.length < 6) {
    throw new Error("[hardhat-tracer]: Faulty LOG4");
  }

  const dataOffset = parseNumber(stack.pop()!);
  const dataSize = parseNumber(stack.pop()!);
  const topic0 = parseBytes32(stack.pop()!);
  const topic1 = parseBytes32(stack.pop()!);
  const topic2 = parseBytes32(stack.pop()!);
  const topic3 = parseBytes32(stack.pop()!);

  const data = hexPrefix(
    Buffer.from(step.memory.slice(dataOffset, dataOffset + dataSize)).toString(
      "hex"
    )
  );

  return {
    opcode: "LOG4",
    params: {
      data,
      topics: [topic0, topic1, topic2, topic3],
      address: currentAddress,
    },
    format(): string {
      throw new Error("[hardhat-tracer]: Not implemented directly");
    },
  };
}

export default { parse };
