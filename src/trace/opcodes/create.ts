import { Item } from "../transaction";

export interface CREATE {
  initCode: string;
  value: string;
  deployedCode?: string;
  deployedAddress?: string;
  gasLimit: number;
  gasUsed?: number;
}

function format(item: Item<CREATE>): string {
  return `CREATE inputCodeLength=${item.params.initCode.length}`;
}

export default { format };
