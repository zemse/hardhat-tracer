import { StructLog, TracerDependenciesExtended } from "../types";

export function printGasCost(
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
