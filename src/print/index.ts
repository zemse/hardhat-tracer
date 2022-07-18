import { TracerDependenciesExtended } from "../types";
import { isOnlyLogs } from "../utils";
import { printDebugTrace } from "./debug-trace";
import { printLogs } from "./logs";

export { printDebugTrace, printLogs };

export async function printDebugTraceOrLogs(
  txHash: string,
  dependencies: TracerDependenciesExtended
) {
  if (isOnlyLogs(dependencies.tracerEnv)) {
    // if user requested logs, print only logs
    await printLogs(txHash, dependencies);
  } else {
    // otherwise, print debug trace which includes logs
    try {
      await printDebugTrace(txHash, dependencies);
    } catch (error) {
      // if error is about debug_tt not supported, print a more readable error
      if ((error as any).message.includes("debug_traceTransaction")) {
        console.warn(
          `Warning! Debug Transaction not supported on this network, falling back to --logs`
        );
      } else {
        // else print what the error is
        console.error("Error in printDebugTraceElseLogs:", error);
        console.warn(
          `If you think the above error is a bug, please report it to https://github.com/zemse/hardhat-tracer/issues/new, meanwhile falling back to --logs:`
        );
      }

      // fallback to logs
      await printLogs(txHash, dependencies);
    }
  }
  return true;
}
