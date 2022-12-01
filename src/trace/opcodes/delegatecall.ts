import { formatCall } from "../../format/call";
import { TracerDependencies } from "../../types";
import { Item } from "../../utils";

export interface DELEGATECALL {
  to: string;
  inputData: string;
  returnData?: string;
  gasLimit: number;
  gasUsed?: number;
  success?: boolean;
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
      item.params.success ?? true, // if we don't have success, assume it was successful
      dependencies
    ))
  );
}

export default { format };
