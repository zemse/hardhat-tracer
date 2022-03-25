import { hexlify } from "@ethersproject/bytes";
import { DEPTH_INDENTATION } from "../../constants";
import { formatContract } from "../../formatter";
import { StructLog, TracerDependenciesExtended } from "../../types";
import {
  shallowCopyStack,
  parseUint,
  parseNumber,
  parseMemory,
} from "../../utils";

export async function printCreate2(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 4) {
    console.log("Faulty CREATE2");
    return;
  }

  const value = parseUint(stack.pop()!);
  const codeOffset = parseNumber(stack.pop()!);
  const codeSize = parseNumber(stack.pop()!);
  const salt = parseUint(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const codeWithArgs = hexlify(memory.slice(codeOffset, codeOffset + codeSize));

  const str = await formatContract(codeWithArgs, value, salt, dependencies);
  console.log(DEPTH_INDENTATION.repeat(structLog.depth) + "CREATE2 " + str);
}
