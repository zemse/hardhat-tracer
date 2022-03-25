import { hexlify } from "@ethersproject/bytes";
import { DEPTH_INDENTATION } from "../../constants";
import { formatError } from "../../formatter";
import { StructLog, TracerDependenciesExtended } from "../../types";
import { shallowCopyStack, parseNumber, parseMemory } from "../../utils";

export async function printRevert(
  structLog: StructLog,
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 2) {
    console.log("Faulty REVERT");
    return;
  }
  const dataOffset = parseNumber(stack.pop()!);
  const dataSize = parseNumber(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const input = hexlify(memory.slice(dataOffset, dataOffset + dataSize));

  const str = await formatError(input, dependencies);
  console.log(DEPTH_INDENTATION.repeat(structLog.depth) + "REVERT " + str);
}
