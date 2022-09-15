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
      dependencies
    ))
  );
}

export default { format };
