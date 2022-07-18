import { colorLabel } from "../colors";
import { DEPTH_INDENTATION } from "../constants";
import { StructLog, TracerDependenciesExtended } from "../types";
import { parseHex, parseMemory, parseNumber, shallowCopyStack } from "../utils";
import { formatParam } from "../format/param";
import { formatGasCost } from "../format/gas-cost";
import { hexlify } from "ethers/lib/utils";

export async function printSha3(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length < 1) {
    console.log("Faulty SHA3");
    return;
  }
  const start = parseNumber(stack.pop()!);
  const length = parseNumber(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const inputToBeHashed = hexlify(memory.slice(start, start + length));

  const stackAfter = shallowCopyStack(structLogs[index + 1].stack);
  const result = parseHex(stackAfter.pop()!);

  const str = `${formatParam(inputToBeHashed, dependencies)} => (${formatParam(
    result,
    dependencies
  )})`;
  console.log(
    DEPTH_INDENTATION.repeat(structLog.depth) +
      colorLabel("SHA3") +
      " " +
      str +
      formatGasCost(structLog, null, dependencies)
  );
}
