import { hexlify } from "@ethersproject/bytes";
import { DEPTH_INDENTATION } from "../../constants";
import { formatLog } from "../../formatter";
import { StructLog, TracerDependenciesExtended } from "../../types";
import {
  shallowCopyStack,
  parseNumber,
  parseHex,
  parseMemory,
  isOnlyLogs,
} from "../../utils";

export async function printLog1(
  structLog: StructLog,
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 3) {
    console.log("Faulty LOG1");
    return;
  }

  const dataOffset = parseNumber(stack.pop()!);
  const dataSize = parseNumber(stack.pop()!);
  const topic0 = parseHex(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const data = hexlify(memory.slice(dataOffset, dataOffset + dataSize));

  const str = await formatLog(
    {
      data,
      topics: [topic0],
    },
    dependencies
  );
  console.log(
    DEPTH_INDENTATION.repeat(
      isOnlyLogs(dependencies.tracerEnv) ? 1 : structLog.depth
    ) +
      "EVENT " +
      str
  );
}
