import { formatLog } from "../format/log";
import { Item, TracerDependencies } from "../types";
import { colorLabel } from "../utils";

import { parse } from ".";

export interface LOG {
  data: string;
  topics: string[];
  address: { value: string };
}

async function format(
  item: Item<LOG>,
  dependencies: TracerDependencies
): Promise<string> {
  return `${colorLabel("[EVENT]")} ${await formatLog(
    {
      data: item.params.data,
      topics: item.params.topics,
    },
    item.params.address.value,
    dependencies
  )}`;
}

export default { format };
