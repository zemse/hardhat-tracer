import { hexlify } from "ethers/lib/utils";

import { colorLabel } from "../../colors";
import { DEPTH_INDENTATION } from "../../constants";
import { StructLog, TracerDependenciesExtended } from "../../types";
import { parseMemory, parseNumber, shallowCopyStack } from "../../utils";
import { formatError } from "../format/error";
import { printGasCost } from "../print-gas-cost";

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
  console.log(
    DEPTH_INDENTATION.repeat(structLog.depth) +
      colorLabel("REVERT") +
      " " +
      str +
      printGasCost(structLog, null, dependencies)
  );
}
