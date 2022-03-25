import { hexlify } from "@ethersproject/bytes";
import { DEPTH_INDENTATION } from "../../constants";
import { formatLog } from "../../formatter";
import { StructLog, TracerDependenciesExtended } from "../../types";
import { shallowCopyStack, parseNumber, parseMemory } from "../../utils";

export async function printLog0(
  structLog: StructLog,
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 2) {
    console.log("Faulty LOG0");
    return;
  }

  const dataOffset = parseNumber(stack.pop()!);
  const dataSize = parseNumber(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const data = hexlify(memory.slice(dataOffset, dataOffset + dataSize));

  const str = await formatLog(
    {
      data,
      topics: [],
    },
    dependencies
  );
  console.log(DEPTH_INDENTATION.repeat(structLog.depth) + "EVENT " + str);
}
