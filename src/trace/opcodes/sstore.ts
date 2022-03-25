import chalk from "chalk";
import { DEPTH_INDENTATION } from "../../constants";
import { formatError, stringifyValue } from "../../formatter";
import { StructLog, TracerDependenciesExtended } from "../../types";
import {
  parseHex,
  parseMemory,
  parseNumber,
  shallowCopyStack,
} from "../../utils";
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

  const str = `${chalk.redBright(key)} <= (${stringifyValue(
    value,
    dependencies
  )})`;
  console.log(
    DEPTH_INDENTATION.repeat(structLog.depth) +
      "SSTORE " +
      str +
      printGasCost(structLog, null, dependencies)
  );
}
