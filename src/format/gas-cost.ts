import { StructLog, TracerDependenciesExtended } from "../types";

/**
 * Formats gas cost for a given structLog
 * @param structLog StructLog to print gas cost for
 * @param gasCost Gas cost override to print
 * @param dependencies Tracer dependencies
 * @returns
 */
export function formatGasCost(
  structLog: StructLog,
  gasCost: number | null,
  dependencies: TracerDependenciesExtended
) {
  if (dependencies.tracerEnv.gasCost) {
    return ` (cost: ${gasCost ?? structLog.gasCost})`;
  } else {
    return "";
  }
}
