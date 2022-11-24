import { formatCall } from "../../format/call";
import { TracerDependencies } from "../../types";
import { Item } from "../transaction";

export interface CALL {
  to: string;
  inputData: string;
  value: string;
  returnData?: string;
  gasLimit: number;
  gasUsed?: number;
  success?: boolean;
}

async function format(
  item: Item<CALL>,
  dependencies: TracerDependencies
): Promise<string> {
  return (
    "CALL " +
    (await formatCall(
      item.params.to,
      item.params.inputData,
      // TODO refactor these input types or order
      item.params.returnData ?? "0x",
      item.params.value,
      item.params.gasLimit,
      item.params.success ?? true, // if we don't have success, assume it was successful
      dependencies
    ))
  );
}

export default { format };
