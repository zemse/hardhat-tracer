import { EvmError } from "@nomicfoundation/ethereumjs-evm/src/exceptions";
import { formatCall } from "../../format/call";
import { Item } from "../../utils";
import { TracerDependencies } from "../../types";

export interface CALL {
  to: string;
  inputData: string;
  value: string;
  returnData?: string;
  exception?: EvmError;
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
      item.params.gasUsed ?? 0,
      item.params.gasLimit,
      item.params.success ?? true, // if we don't have success, assume it was successful
      dependencies
    ))
  );
}

export default { format };
