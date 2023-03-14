import { parse } from ".";
import { formatLog } from "../format/log";
import { TracerDependencies } from "../types";
import { Item } from "../types";
import { colorLabel } from "../utils";

export interface LOG {
  data: string;
  topics: string[];
  address: string;
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
    item.params.address,
    dependencies
  )}`;
}

export default { format };
