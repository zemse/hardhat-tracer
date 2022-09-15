import { Item } from "../transaction";

export interface CALL {
  to: string;
  inputData: string;
  value: string;
  returnData?: string;
  gasLimit: number;
  gasUsed?: number;
}

function format(item: Item<CALL>): string {
  return `CALL ${item.params.to}{value:${item.params.value}}(calldata=${item.params.inputData},returndata=${item.params.returnData})`;
}

export default { format };
