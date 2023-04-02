import { formatContract } from "../format/contract";
import { Item, TracerDependencies } from "../types";
import { colorLabel } from "../utils";

export interface CREATE {
  from: string;
  initCode: string;
  value: string;
  deployedCode?: string;
  deployedAddress?: string;
  gasLimit: number;
  gasUsed?: number;
}

async function format(
  item: Item<CREATE>,
  dependencies: TracerDependencies
): Promise<string> {
  return (
    colorLabel("[CREATE]") +
    " " +
    (await formatContract(
      item.params.initCode,
      item.params.value,
      null,
      item.params.deployedAddress ?? "no address",
      dependencies
    ))
  );
}

export default { format };
