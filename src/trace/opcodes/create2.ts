import { hexlify } from "ethers/lib/utils";

import { colorLabel } from "../../colors";
import { DEPTH_INDENTATION } from "../../constants";
import { StructLog, TracerDependenciesExtended } from "../../types";
import {
  findNextStructLogInDepth,
  parseAddress,
  parseMemory,
  parseNumber,
  parseUint,
  shallowCopyStack,
} from "../../utils";
import { formatContract } from "../format/contract";
import { printGasCost } from "../print-gas-cost";

export async function printCreate2(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 4) {
    console.log("Faulty CREATE2");
    return;
  }

  const value = parseUint(stack.pop()!);
  const codeOffset = parseNumber(stack.pop()!);
  const codeSize = parseNumber(stack.pop()!);
  const salt = parseUint(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const codeWithArgs = hexlify(memory.slice(codeOffset, codeOffset + codeSize));

  const [structLogNextNext] = findNextStructLogInDepth(
    structLogs,
    structLog.depth,
    index + 1 // find next structLog in the same depth
  );
  const deployedAddress = parseAddress(
    shallowCopyStack(structLogNextNext.stack).pop()!
  );

  const str = await formatContract(
    codeWithArgs,
    value,
    salt,
    deployedAddress,
    dependencies
  );
  console.log(
    DEPTH_INDENTATION.repeat(structLog.depth) +
      colorLabel("CREATE2") +
      " " +
      str +
      printGasCost(structLog, null, dependencies)
  );
  return deployedAddress;
}
