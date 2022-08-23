import { colorLabel, colorSstore } from "../colors";
import { DEPTH_INDENTATION } from "../constants";
import { StructLog, TracerDependenciesExtended } from "../types";
import { parseHex, parseMemory, parseNumber, shallowCopyStack } from "../utils";
import { formatParam } from "../format/param";
import { formatGasCost } from "../format/gas-cost";

export async function printMstore(
  structLog: StructLog,
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 2) {
    console.log("Faulty MSTORE");
    return;
  }
  const key = parseHex(stack.pop()!);
  const value = parseHex(stack.pop()!);

  const str = `${colorSstore(key)} <= (${formatParam(value, dependencies)})`;
  console.log(
    DEPTH_INDENTATION.repeat(structLog.depth) +
      colorLabel("MSTORE") +
      " " +
      str +
      formatGasCost(structLog, null, dependencies)
  );
}
