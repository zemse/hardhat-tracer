import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";
import { Item } from "../types";
import { memorySlice } from "../utils";

export interface RETURN {
  data: string;
}

function parse(step: MinimalInterpreterStep): Item<RETURN> {
  const offset = Number(step.stack[step.stack.length - 1].toString());
  const length = Number(step.stack[step.stack.length - 2].toString());
  const data = memorySlice(step.memory, offset, length);
  return {
    opcode: "RETURN",
    params: { data },
    noFormat: true,
  };
}

export default { parse };
