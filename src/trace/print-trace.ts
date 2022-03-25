import chalk from "chalk";
import { formatCall, formatContract } from "../formatter";
import { StructLog, TracerDependenciesExtended } from "../types";
import { isOnlyLogs, parseUint } from "../utils";
import { printCall } from "./opcodes/call";
import { printCallCode } from "./opcodes/callcode";
import { printCreate } from "./opcodes/create";
import { printCreate2 } from "./opcodes/create2";
import { printDelegateCall } from "./opcodes/delegatecall";
import { printLog0 } from "./opcodes/log0";
import { printLog1 } from "./opcodes/log1";
import { printLog2 } from "./opcodes/log2";
import { printLog3 } from "./opcodes/log3";
import { printLog4 } from "./opcodes/log4";
import { printRevert } from "./opcodes/revert";
import { printStaticCall } from "./opcodes/staticcall";

export async function printTrace(
  txHash: string,
  dependencies: TracerDependenciesExtended
) {
  try {
    const res = await dependencies.provider.send("debug_traceTransaction", [
      txHash,
    ]);
    const tx = await dependencies.provider.send("eth_getTransactionByHash", [
      txHash,
    ]);
    if (
      tx.to != null &&
      tx.to != "0x" &&
      tx.to != "0x0000000000000000000000000000000000000000"
    ) {
      // normal transaction
      console.log(
        "CALL " +
          (await formatCall(
            tx.to,
            tx.input,
            "0x",
            tx.value,
            tx.gas,
            dependencies
          ))
      );
    } else {
      // contract deploy transaction
      const str = await formatContract(
        tx.input,
        parseUint(tx.value ?? "0x"),
        null,
        dependencies
      );
      console.log("CREATE " + str);
    }

    for (const [i, structLog] of (res.structLogs as StructLog[]).entries()) {
      await printStructLog(structLog, i, res.structLogs, dependencies);
    }
  } catch (error) {
    // if debug_traceTransaction failed then print warning
    if ((error as any).message.includes("debug_traceTransaction")) {
      console.log(
        chalk.yellow(`Warning! Debug Transaction not supported on this network`)
      );
    } else {
      // else print what the error is
      console.error(error);
    }
  }
}

async function printStructLog(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  // if running in logs mode exit if opcode is not a LOG
  if (isOnlyLogs(dependencies.tracerEnv) && !structLog.op.startsWith("LOG"))
    return;

  // TODO add SLOAD and SSTORE
  switch (structLog.op) {
    case "CREATE":
      await printCreate(structLog, index, structLogs, dependencies);
      break;
    case "CREATE2":
      await printCreate2(structLog, index, structLogs, dependencies);
      break;
    case "CALL":
      await printCall(structLog, index, structLogs, dependencies);
      break;
    case "printCallCode":
      await printCallCode(structLog, index, structLogs, dependencies);
      break;
    case "STATICCALL":
      await printStaticCall(structLog, index, structLogs, dependencies);
      break;
    case "DELEGATECALL":
      await printDelegateCall(structLog, index, structLogs, dependencies);
      break;
    case "LOG0":
      await printLog0(structLog, dependencies);
      break;
    case "LOG1":
      await printLog1(structLog, dependencies);
      break;
    case "LOG2":
      await printLog2(structLog, dependencies);
      break;
    case "LOG3":
      await printLog3(structLog, dependencies);
      break;
    case "LOG4":
      await printLog4(structLog, dependencies);
      break;
    case "REVERT":
      await printRevert(structLog, dependencies);
      break;
    default:
      break;
  }
}
