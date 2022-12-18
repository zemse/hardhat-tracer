import { colorError } from "../../colors";
import { formatObject } from "../../format/object";
import { Item } from "../../utils";

export interface EXCEPTION {
  type: string;
  error: string;
}

async function format(item: Item<EXCEPTION>): Promise<string> {
  return `EXCEPTION ${colorError(item.params.type)}(${formatObject({
    reason: item.params.error,
  })})`;
}

export default { format };
