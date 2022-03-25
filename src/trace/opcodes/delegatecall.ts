import { hexlify } from "@ethersproject/bytes";
import { DEPTH_INDENTATION } from "../../constants";
import { formatData } from "../../formatter";
import { StructLog, TracerDependenciesExtended } from "../../types";
import {
  shallowCopyStack,
  parseUint,
  parseAddress,
  parseNumber,
  parseMemory,
} from "../../utils";

export async function printDelegateCall(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 6) {
    console.log("Faulty DELEGATECALL");
    return;
  }

  const gas = parseUint(stack.pop()!);
  const to = parseAddress(stack.pop()!);
  // hardhat console.log address
  if (to === "0x000000000000000000636f6e736f6c652e6c6f67") return;
  const argsOffset = parseNumber(stack.pop()!);
  const argsSize = parseNumber(stack.pop()!);
  const retOffset = parseNumber(stack.pop()!);
  const retSize = parseNumber(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const input = hexlify(memory.slice(argsOffset, argsOffset + argsSize));
  const ret = hexlify(memory.slice(retOffset, retOffset + retSize));

  // console.log("parsed static call", { gas, to, input, ret });
  const str = await formatData(to, input, ret, 0, gas, dependencies);
  console.log(
    DEPTH_INDENTATION.repeat(structLog.depth) + "DELEGATECALL " + str
  );
}
