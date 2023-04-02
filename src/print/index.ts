import { TransactionTrace } from "../transaction-trace";
import { TracerDependencies } from "../types";

import { printConsole } from "./console";
import { printJson } from "./json";

export function print(
  txTrace: TransactionTrace,
  dependencies: TracerDependencies
) {
  switch (dependencies.tracerEnv.printMode) {
    case "console":
      return printConsole(txTrace, dependencies);
    case "json":
      return printJson(txTrace);
    default:
      throw new Error(
        `[hardhat-tracer]: printMode "${dependencies.tracerEnv.printMode}" is not supported`
      );
  }
}
