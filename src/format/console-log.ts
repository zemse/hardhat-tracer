import { Interface } from "ethers/lib/utils";
import { TracerDependencies } from "../types";
import { formatResult } from "./result";
import consoleLogMethods from "./console-log-methods.json";

// TODO try to import this from somewhere in hardhat
export const CONSOLE_LOG_ADDRESS = "0x000000000000000000636f6e736f6c652e6c6f67";

export function formatConsoleLog(
  data: string,
  dependencies: TracerDependencies
): string | never {
  const iface = new Interface(consoleLogMethods);

  const signature = data.slice(0, 10);
  const result = iface.decodeFunctionData(signature, data);
  return formatResult(
    result,
    iface.getFunction(signature),
    { isInput: true },
    dependencies
  );
}
