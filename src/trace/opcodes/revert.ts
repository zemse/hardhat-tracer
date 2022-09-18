import { InterpreterStep } from "@ethereumjs/vm/dist/evm/interpreter";
import { formatError } from "../../format/error";
import { TracerDependencies } from "../../types";
import { hexPrefix } from "../../utils";
import { Item } from "../transaction";

export interface REVERT {
  data: string;
}

function parse(step: InterpreterStep): Item<REVERT> {
  const offset = step.stack[step.stack.length - 1].toNumber();
  const length = step.stack[step.stack.length - 2].toNumber();
  const data = hexPrefix(
    step.memory.slice(offset, offset + length).toString("hex")
  );

  return {
    opcode: "REVERT",
    params: { data },
  };
}

async function format(
  item: Item<REVERT>,
  dependencies: TracerDependencies
): Promise<string> {
  return `REVERT ${await formatError(item.params.data, dependencies)}`;
}

export default { parse, format };
