import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { formatError } from "../format/error";
import { Item, TracerDependencies } from "../types";
import { colorLabel, hexPrefix, memorySlice } from "../utils";

export interface REVERT {
  data: string;
}

function parse(step: MinimalInterpreterStep): Item<REVERT> {
  const offset = Number(step.stack[step.stack.length - 1].toString());
  const length = Number(step.stack[step.stack.length - 2].toString());
  const data = memorySlice(step.memory, offset, length);
  return {
    opcode: "REVERT",
    params: { data },
  };
}

async function format(
  item: Item<REVERT>,
  dependencies: TracerDependencies
): Promise<string> {
  return `${colorLabel("[REVERT]")} ${await formatError(
    item.params.data,
    dependencies
  )}`;
}

export default { parse, format };
