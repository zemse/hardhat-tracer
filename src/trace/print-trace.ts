import { ethers } from "ethers";
import { getContractAddress } from "ethers/lib/utils";

import { colorLabel, colorWarning } from "../colors";
import { DEPTH_INDENTATION } from "../constants";
import { StructLog, TracerDependenciesExtended } from "../types";
import { isOnlyLogs, parseUint } from "../utils";

import { formatCall } from "./format/call";
import { formatContract } from "./format/contract";
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
import { printSload } from "./opcodes/sload";
import { printSstore } from "./opcodes/sstore";
import { printStaticCall } from "./opcodes/staticcall";

export async function printTrace(
  txHash: string,
  dependencies: TracerDependenciesExtended
) {
  const addressStack: Array<string | undefined> = [];
  try {
    const res = await dependencies.provider.send("debug_traceTransaction", [
      txHash,
      { disableStorage: true },
    ]);
    const tx = await dependencies.provider.send("eth_getTransactionByHash", [
      txHash,
    ]);
    if (
      tx.to !== null &&
      tx.to !== "0x" &&
      tx.to !== "0x0000000000000000000000000000000000000000"
    ) {
      // normal transaction
      console.log(
        colorLabel("CALL") +
          " " +
          (await formatCall(
            tx.to,
            tx.input,
            "0x",
            tx.value,
            tx.gas,
            dependencies
          ))
      );
      addressStack.push(tx.to);
    } else {
      // contract deploy transaction
      const str = await formatContract(
        tx.input,
        parseUint(tx.value ?? "0x"),
        null,
        getContractAddress(tx),
        dependencies
      );
      addressStack.push(getContractAddress(tx));
      console.log(colorLabel("CREATE") + " " + str);
    }

    for (const [i, structLog] of (res.structLogs as StructLog[]).entries()) {
      await printStructLog(
        structLog,
        i,
        res.structLogs,
        addressStack,
        dependencies
      );
    }
  } catch (error) {
    // if debug_traceTransaction failed then print warning
    if ((error as any).message.includes("debug_traceTransaction")) {
      console.log(
        colorWarning(`Warning! Debug Transaction not supported on this network`)
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
