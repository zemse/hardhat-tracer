import { ethers } from "ethers";

import { TracerDependencies } from "../types";

import consoleLogMethods from "./console-log-methods.json";
import { formatResult } from "./result";

// TODO try to import this from somewhere in hardhat
export const CONSOLE_LOG_ADDRESS = "0x000000000000000000636f6e736f6c652e6c6f67";

export function formatConsoleLog(
  data: string,
  dependencies: TracerDependencies
): string | never {
  ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);
  const iface = new ethers.utils.Interface(consoleLogMethods);

  const signature = data.slice(0, 10);
  const result = iface.decodeFunctionData(signature, data);
  return formatResult(
    result,
    iface.getFunction(signature).inputs,
    {},
    dependencies
  );
}
