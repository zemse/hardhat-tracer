import { DEPTH_INDENTATION } from "../constants";
import { TracerDependenciesExtended } from "../types";
import { formatLog } from "../format/log";
import { printTopLevelTx } from "./top-level-tx";

/**
 * Makes a eth_getTransactionReceipt query and uses log formatter
 * @param txHash Transaction hash
 * @param dependencies Tracer dependencies
 */
export async function printLogs(
  txHash: string,
  dependencies: TracerDependenciesExtended
) {
  const rc = await dependencies.provider.send("eth_getTransactionReceipt", [
    txHash,
  ]);
  const addressStack: Array<string | undefined> = [];
  await printTopLevelTx(txHash, addressStack, dependencies);
  if (rc && rc.logs && rc.logs.length) {
    for (const log of rc.logs) {
      console.log(
        DEPTH_INDENTATION + (await formatLog(log, log.address, dependencies))
      );
    }
  }
}
