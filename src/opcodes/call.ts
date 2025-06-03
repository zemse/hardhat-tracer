import { formatCall } from "../format/call";
import { Item, TracerDependencies } from "../types";
import { colorLabel } from "../utils";

export interface CALL {
  from: string;
  to: string;
  inputData: string;
  value: string;
  returnData?: string;
  exception?: string;
  gasLimit: number;
  gasUsed?: number;
  success?: boolean;
}

async function format(
  item: Item<CALL>,
  dependencies: TracerDependencies
): Promise<string> {
  return (
    colorLabel("[CALL]") +
    " " +
    (await formatCall(
      item.params.to,
      item.params.inputData,
      // TODO refactor these input types or order
      item.params.returnData ?? "0x",
      item.params.value,
      item.params.gasUsed ?? 0,
      item.params.gasLimit,
      item.params.success ?? true, // if we don't have success, assume it was successful
      dependencies
    ))
  );
}

export default { format };
