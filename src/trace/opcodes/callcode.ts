import { hexlify } from "ethers/lib/utils";

import { colorLabel } from "../../colors";
import { DEPTH_INDENTATION } from "../../constants";
import { StructLog, TracerDependenciesExtended } from "../../types";
import {
  findNextStructLogInDepth,
  parseAddress,
  parseMemory,
  parseNumber,
  parseUint,
  shallowCopyStack,
} from "../../utils";
import { formatCall } from "../format/call";
import { printGasCost } from "../print-gas-cost";

export async function printCallCode(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 7) {
    console.log("Faulty CALLCODE");
    return;
  }

  const gas = parseUint(stack.pop()!);
  const to = parseAddress(stack.pop()!);
  const value = parseUint(stack.pop()!);
  const argsOffset = parseNumber(stack.pop()!);
  const argsSize = parseNumber(stack.pop()!);
  const retOffset = parseNumber(stack.pop()!);
  const retSize = parseNumber(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const input = hexlify(memory.slice(argsOffset, argsOffset + argsSize));

  // return data
  const [structLogNext, structLogNextNext] = findNextStructLogInDepth(
    structLogs,
    structLog.depth,
    index + 1 // find next structLog in the same depth
  );
  const ret = hexlify(
    parseMemory(structLogNext.memory).slice(retOffset, retOffset + retSize)
  );

  const str = await formatCall(to, input, ret, value, gas, dependencies);
  console.log(
    DEPTH_INDENTATION.repeat(structLog.depth) +
      colorLabel("CALLCODE") +
      " " +
      str +
      printGasCost(
        structLog,
        structLog.gas - structLogNextNext.gas,
        dependencies
      )
  );
}
