import { Item } from "../transaction";

export interface STATICCALL {
  to: string;
  inputData: string;
  returnData?: string;
  gasLimit: number;
  gasUsed?: number;
}

function format(item: Item<STATICCALL>): string {
  return `STATICCALL ${item.params.to}(calldata=${item.params.inputData},returndata=${item.params.returnData})`;
}

export default { format };
