import { formatCall } from "../../format/call";
import { TracerDependencies } from "../../types";
import { Item } from "../transaction";

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
