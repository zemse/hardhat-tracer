import { formatCall } from "../../format/call";
import { TracerDependencies } from "../../types";
import { Item } from "../transaction";

export interface DELEGATECALL {
  to: string;
  inputData: string;
  returnData?: string;
  gasLimit: number;
  gasUsed?: number;
}

async function format(
  item: Item<DELEGATECALL>,
  dependencies: TracerDependencies
): Promise<string> {
  return (
    "DELEGATECALL " +
    (await formatCall(
      item.params.to,
      item.params.inputData,
      // TODO refactor these input types or order
      item.params.returnData ?? "0x",
      0, // TODO show some how that msg.value
      item.params.gasLimit,
      dependencies
    ))
  );
}

export default { format };
