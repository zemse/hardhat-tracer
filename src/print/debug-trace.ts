import { StructLog, TracerDependenciesExtended } from "../types";
import { printStructLog } from "./struct-log";
import { printTopLevelTx } from "./top-level-tx";

/**
 * Makes a debug_traceTransaction query and uses structLog formatter
 * @param txHash Transaction hash
 * @param dependencies Tracer dependencies
 */
export async function printDebugTrace(
  txHash: string,
  dependencies: TracerDependenciesExtended
) {
  const trace = await dependencies.provider.send("debug_traceTransaction", [
    txHash,
    { disableStorage: true },
  ]);

  const addressStack: Array<string | undefined> = [];
  await printTopLevelTx(txHash, addressStack, dependencies);
  for (const [i, structLog] of (trace.structLogs as StructLog[]).entries()) {
    await printStructLog(
      structLog,
      i,
      trace.structLogs,
      addressStack,
      dependencies
    );
  }
}
