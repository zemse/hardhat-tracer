import { formatObject } from "../format/object";
import { Item } from "../types";
import { colorError, colorLabel } from "../utils/colors";

export interface EXCEPTION {
  type: string;
  error: string;
}

async function format(item: Item<EXCEPTION>): Promise<string> {
  return `${colorLabel("[EXCEPTION]")} ${colorError(
    item.params.type
  )}(${formatObject({
    reason: item.params.error,
  })})`;
}

export default { format };
