import { Interface } from "ethers/lib/utils";

import { colorError } from "../colors";
import { TracerDependenciesExtended } from "../types";
import { formatObject } from "./object";

import { formatParam } from "./param";
import { formatResult } from "./result";

export async function formatError(
  revertData: string,
  dependencies: TracerDependenciesExtended
) {
  const commonErrors = [
    "function Error(string reason)",
    "function Panic(uint256 code)",
  ];
  try {
    const iface = new Interface(commonErrors);
    const parsed = iface.parseTransaction({
      data: revertData,
    });

    if (parsed.name === "Panic") {
      const panicCode = parsed.args.code.toNumber();
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
      return `${colorError(parsed.name)}(${formatObject({
        code: panicCode,
        situation,
      })})`;
    }

    const formatted = formatResult(
      parsed.args,
      parsed.functionFragment,
      { decimals: -1, isInput: true, shorten: false },
      dependencies
    );

    return `${colorError(parsed.name)}(${formatted})`;
  } catch {}

  // if error not common then try to parse it as a custom error
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  for (const name of names) {
    const artifact = await dependencies.artifacts.readArtifact(name);
    const iface = new Interface(artifact.abi);

    try {
      const errorDesc = iface.parseError(revertData);
      return `${colorError(errorDesc.name)}(${formatResult(
        errorDesc.args,
        errorDesc.errorFragment,
        { decimals: -1, isInput: true, shorten: false },
        dependencies
      )})`;
    } catch {}
  }

  return `${colorError("UnknownError")}(${formatParam(
    revertData,
    dependencies
  )})`;
}
