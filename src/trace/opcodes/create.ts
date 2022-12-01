import { formatContract } from "../../format/contract";
import { TracerDependencies } from "../../types";
import { Item } from "../../utils";

export interface CREATE {
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
    "CREATE " +
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
