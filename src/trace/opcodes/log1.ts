import { hexlify } from "ethers/lib/utils";

import { colorLabel } from "../../colors";
import { DEPTH_INDENTATION } from "../../constants";
import { StructLog, TracerDependenciesExtended } from "../../types";
import {
  isOnlyLogs,
  parseHex,
  parseMemory,
  parseNumber,
  shallowCopyStack,
} from "../../utils";
import { formatLog } from "../format/log";
import { printGasCost } from "../print-gas-cost";

export async function printLog1(
  structLog: StructLog,
  currentAddress: string | undefined,
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
    currentAddress,
    dependencies
  );
  console.log(
    DEPTH_INDENTATION.repeat(
      isOnlyLogs(dependencies.tracerEnv) ? 1 : structLog.depth
    ) +
      colorLabel("EVENT") +
      " " +
      str +
      printGasCost(structLog, null, dependencies)
  );
}
