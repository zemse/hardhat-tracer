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
} from "../../utils";

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
  const ret = hexlify(memory.slice(retOffset, retOffset + retSize));

  // console.log("call", structLog);
  // console.log("parsed call", { gas, to, value, input, ret });

  const str = await formatData(to, input, ret, value, gas, dependencies);
  console.log(DEPTH_INDENTATION.repeat(structLog.depth) + "CALLCODE " + str);
}
