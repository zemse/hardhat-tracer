import { formatCall } from "../format/call";
import { CONSOLE_LOG_ADDRESS, formatConsoleLog } from "../format/console-log";
import { Item, TracerDependencies } from "../types";
import { colorConsole, colorLabel } from "../utils/colors";

// ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);

export interface STATICCALL {
  from: string;
  to: string;
  inputData: string;
  returnData?: string;
  gasLimit: number;
  gasUsed?: number;
  success?: boolean;
}

async function format(
  item: Item<STATICCALL>,
  dependencies: TracerDependencies
): Promise<string> {
  if (item.params.to.toLowerCase() === CONSOLE_LOG_ADDRESS.toLowerCase()) {
    try {
      const formatted = formatConsoleLog(item.params.inputData, dependencies);
      return `${colorConsole("console.log")}(${formatted})`;
    } catch (e) {
      console.error("hardhat-tracer opcodes/staticcall/format", e);
    }
  }

  return (
    colorLabel("[STATICCALL]") +
    " " +
    (await formatCall(
      item.params.to,
      item.params.inputData,
      // TODO refactor these input types or order
      item.params.returnData ?? "0x",
      0,
      item.params.gasUsed ?? 0,
      item.params.gasLimit,
      item.params.success ?? true, // if we don't have success, assume it was successful
      dependencies
    ))
  );
}

export default { format };
