import { parse } from ".";
import { formatLog } from "../format/log";
import { TracerDependencies } from "../types";
import { Item } from "../types";

export interface LOG {
  data: string;
  topics: string[];
  address: string;
}

async function format(
  item: Item<LOG>,
  dependencies: TracerDependencies
): Promise<string> {
  return `EVENT ${await formatLog(
    {
      data: item.params.data,
      topics: item.params.topics,
    },
    item.params.address,
    dependencies
  )}`;
}

export default { format };
