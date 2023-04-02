import { TracerDependencies } from "../types";
import { colorError } from "../utils/colors";

import { formatObject } from "./object";
import { formatParam } from "./param";
import { formatResult } from "./result";

export async function formatError(
  revertData: string,
  dependencies: TracerDependencies
) {
  try {
    const {
      fragment,
      revertResult,
    } = await dependencies.tracerEnv.decoder!.decodeError(revertData);

    if (fragment.name === "Panic") {
      const panicCode = revertResult.code.toNumber();
      let situation = "";
      switch (panicCode) {
        case 0x01:
          situation = "assert false";
          break;
        case 0x11:
          situation = "arithmetic overflow or underflow";
          break;
        case 0x12:
          situation = "divide or modulo by zero";
          break;
        case 0x21:
          situation = "value invalid for enum";
          break;
        case 0x22:
          situation = "access incorrectly encoded storage byte array";
          break;
        case 0x31:
          situation = "pop on empty array";
          break;
        case 0x32:
          situation = "array index out of bounds";
          break;
        case 0x41:
          situation = "allocating too much memory";
          break;
        case 0x51:
          situation = "zero internal function";
          break;
      }
      return `${colorError(fragment.name)}(${formatObject({
        code: panicCode,
        situation,
      })})`;
    }

    const formatted = formatResult(
      revertResult,
      fragment.inputs,
      { decimals: -1, shorten: false },
      dependencies
    );

    return `${colorError(fragment.name)}(${formatted})`;
  } catch {}

  // if error could not be decoded, then just show the data
  return `${colorError("UnknownError")}(${formatParam(
    revertData,
    dependencies
  )})`;
}
