import { Item } from "../transaction";

export interface DELEGATECALL {
  to: string;
  inputData: string;
  returnData?: string;
  gasLimit: number;
  gasUsed?: number;
}

function format(item: Item<DELEGATECALL>): string {
  return `DELEGATECALL ${item.params.to}(calldata=${item.params.inputData},returndata=${item.params.returnData})`;
}

export default { format };
