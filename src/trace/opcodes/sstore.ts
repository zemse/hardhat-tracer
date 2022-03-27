import { colorLabel, colorSstore } from "../../colors";
import { DEPTH_INDENTATION } from "../../constants";
import { StructLog, TracerDependenciesExtended } from "../../types";
import {
  parseHex,
  parseMemory,
  parseNumber,
  shallowCopyStack,
} from "../../utils";
import { formatParam } from "../format/param";
import { printGasCost } from "../print-gas-cost";

export async function printSstore(
  structLog: StructLog,
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 2) {
    console.log("Faulty SSTORE");
    return;
  }
  const key = parseHex(stack.pop()!);
  const value = parseHex(stack.pop()!);

  const str = `${colorSstore(key)} <= (${formatParam(value, dependencies)})`;
  console.log(
    DEPTH_INDENTATION.repeat(structLog.depth) +
      colorLabel("SSTORE") +
      " " +
      str +
      printGasCost(structLog, null, dependencies)
  );
}
