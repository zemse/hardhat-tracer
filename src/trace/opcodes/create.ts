import { hexlify } from "@ethersproject/bytes";
import { DEPTH_INDENTATION } from "../../constants";
import { formatContract } from "../../formatter";
import { StructLog, TracerDependenciesExtended } from "../../types";
import {
  parseMemory,
  parseNumber,
  parseUint,
  shallowCopyStack,
} from "../../utils";
import { printGasCost } from "../print-gas-cost";

export async function printCreate(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 3) {
    console.log("Faulty CREATE");
    return;
  }

  const value = parseUint(stack.pop()!);
  const codeOffset = parseNumber(stack.pop()!);
  const codeSize = parseNumber(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const codeWithArgs = hexlify(memory.slice(codeOffset, codeOffset + codeSize));

  const str = await formatContract(codeWithArgs, value, null, dependencies);
  console.log(
    DEPTH_INDENTATION.repeat(structLog.depth) +
      "CREATE " +
      str +
      printGasCost(structLog, null, dependencies)
  );
}
