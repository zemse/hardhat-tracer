import { Item } from "../types";
import { colorLabel } from "../utils";

export interface SELFDESTRUCT {
  beneficiary: string;
}

async function format(item: Item<SELFDESTRUCT>): Promise<string> {
  return `${colorLabel("[SELFDESTRUCT]")} beneficiary=${
    item.params.beneficiary
  }`;
}

export default { format };
