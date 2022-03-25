import { hexlify } from "@ethersproject/bytes";
import { DEPTH_INDENTATION } from "../../constants";
import { formatData } from "../../formatter";
import { StructLog, TracerDependenciesExtended } from "../../types";
import {
  shallowCopyStack,
  parseUint,
  parseAddress,
  parseNumber,
  parseMemory,
  findNextStructLogInDepth,
} from "../../utils";

export async function printStaticCall(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 6) {
    console.log("Faulty STATICCALL");
    return;
  }

  const gas = parseUint(stack.pop()!);
  const to = parseAddress(stack.pop()!);
  // hardhat console.log address
  if (to === "0x000000000000000000636f6e736f6c652e6c6f67") return;
  const argsOffset = parseNumber(stack.pop()!);
  const argsSize = parseNumber(stack.pop()!);
  const retOffset = parseNumber(stack.pop()!);
  const retSize = parseNumber(stack.pop()!);

  // input data
  const input = hexlify(
    parseMemory(structLog.memory).slice(argsOffset, argsOffset + argsSize)
  );

  // return data
  const structLogNext = findNextStructLogInDepth(
    structLogs,
    structLog.depth,
    index + 1 // find next structLog in the same depth
  );
  const ret = hexlify(
    parseMemory(structLogNext.memory).slice(retOffset, retOffset + retSize)
  );

  const str = await formatData(to, input, ret, 0, gas, dependencies);
  console.log(DEPTH_INDENTATION.repeat(structLog.depth) + "STATICCALL " + str);
}
