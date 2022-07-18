import { DEPTH_INDENTATION } from "../constants";
import { StructLog, TracerDependenciesExtended } from "../types";
import { isOnlyLogs } from "../utils";
import { printCall } from "../opcodes/call";
import { printCallCode } from "../opcodes/callcode";
import { printCreate } from "../opcodes/create";
import { printCreate2 } from "../opcodes/create2";
import { printDelegateCall } from "../opcodes/delegatecall";
import { printLog0 } from "../opcodes/log0";
import { printLog1 } from "../opcodes/log1";
import { printLog2 } from "../opcodes/log2";
import { printLog3 } from "../opcodes/log3";
import { printLog4 } from "../opcodes/log4";
import { printRevert } from "../opcodes/revert";
import { printSload } from "../opcodes/sload";
import { printSstore } from "../opcodes/sstore";
import { printStaticCall } from "../opcodes/staticcall";

/**
 * Prints the given structLog to the console.
 * @param structLog StructLog to print
 * @param index Index of the structLog in the trace (used for finding return data structLog)
 * @param structLogs reference to the array of all structLogs
 * @param addressStack reference to the stack of addresses
 * @param dependencies Tracer dependencies
 */
export async function printStructLog(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  addressStack: Array<string | undefined>,
  dependencies: TracerDependenciesExtended
) {
  // if running in logs mode exit if opcode is not a LOG
  if (isOnlyLogs(dependencies.tracerEnv) && !structLog.op.startsWith("LOG")) {
    return;
  }

  switch (structLog.op) {
    case "CREATE":
      addressStack.push(
        await printCreate(structLog, index, structLogs, dependencies)
      );
      break;
    case "CREATE2":
      addressStack.push(
        await printCreate2(structLog, index, structLogs, dependencies)
      );
      break;
    case "CALL":
      addressStack.push(
        await printCall(structLog, index, structLogs, dependencies)
      );
      break;
    case "CALLCODE":
      await printCallCode(structLog, index, structLogs, dependencies);
      break;
    case "STATICCALL":
      addressStack.push(
        await printStaticCall(structLog, index, structLogs, dependencies)
      );
      break;
    case "DELEGATECALL":
      addressStack.push(addressStack[addressStack.length - 1]);
      await printDelegateCall(structLog, index, structLogs, dependencies);
      break;
    case "LOG0":
      await printLog0(
        structLog,
        addressStack[addressStack.length - 1],
        dependencies
      );
      break;
    case "LOG1":
      await printLog1(
        structLog,
        addressStack[addressStack.length - 1],
        dependencies
      );
      break;
    case "LOG2":
      await printLog2(
        structLog,
        addressStack[addressStack.length - 1],
        dependencies
      );
      break;
    case "LOG3":
      await printLog3(
        structLog,
        addressStack[addressStack.length - 1],
        dependencies
      );
      break;
    case "LOG4":
      await printLog4(
        structLog,
        addressStack[addressStack.length - 1],
        dependencies
      );
      break;
    case "SLOAD":
      if (dependencies.tracerEnv.sloads) {
        await printSload(structLog, index, structLogs, dependencies);
      }
      break;
    case "SSTORE":
      if (dependencies.tracerEnv.sstores) {
        await printSstore(structLog, dependencies);
      }
      break;
    case "REVERT":
      await printRevert(structLog, dependencies);
      addressStack.pop();
      break;
    case "RETURN":
      addressStack.pop();
      break;
    case "STOP":
      addressStack.pop();
      break;
    default:
      if (dependencies.tracerEnv.opcodes.includes(structLog.op)) {
        console.log(DEPTH_INDENTATION.repeat(structLog.depth) + structLog.op);
      }
      break;
  }
}
