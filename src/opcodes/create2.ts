import { formatContract } from "../format/contract";
import { TracerDependencies } from "../types";
import { Item } from "../types";

export interface CREATE2 {
  from: string;
  initCode: string;
  salt: string;
  value: string;
  deployedCode?: string;
  deployedAddress?: string;
  gasLimit: number;
  gasUsed?: number;
}

async function format(
  item: Item<CREATE2>,
  dependencies: TracerDependencies
): Promise<string> {
  return (
    "CREATE2 " +
    (await formatContract(
      item.params.initCode,
      item.params.value,
      item.params.salt,
      item.params.deployedAddress ?? "no address",
      dependencies
    ))
  );
}

export default { format };
