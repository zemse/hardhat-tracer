import { colorConsole } from "../../colors";
import { formatCall } from "../../format/call";
import {
  CONSOLE_LOG_ADDRESS,
  formatConsoleLog,
} from "../../format/console-log";
import { TracerDependencies } from "../../types";
import { Item } from "../transaction";

// ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);

export interface STATICCALL {
  to: string;
  inputData: string;
  returnData?: string;
  gasLimit: number;
  gasUsed?: number;
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
    "STATICCALL " +
    (await formatCall(
      item.params.to,
      item.params.inputData,
      // TODO refactor these input types or order
      item.params.returnData ?? "0x",
      0,
      item.params.gasLimit,
      dependencies
    ))
  );
}

export default { format };
