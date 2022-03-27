import { colorLabel, colorSload } from "../../colors";
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

export async function printSload(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 1) {
    console.log("Faulty SLOAD");
    return;
  }
  const key = parseHex(stack.pop()!);
  const stackAfter = shallowCopyStack(structLogs[index + 1].stack);
  const value = parseHex(stackAfter.pop()!);

  const str = `${colorSload(key)} => (${formatParam(value, dependencies)})`;
  console.log(
    DEPTH_INDENTATION.repeat(structLog.depth) +
      colorLabel("SLOAD") +
      " " +
      str +
      printGasCost(structLog, null, dependencies)
  );
}
