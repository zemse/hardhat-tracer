import {
  formatUnits,
  Fragment,
  FunctionFragment,
  Result,
} from "ethers/lib/utils";

import { colorKey } from "../../colors";
import { TracerDependenciesExtended } from "../../types";

import { formatParam } from "./param";

interface FormatOptions {
  decimals?: number;
  isInput?: boolean;
  shorten?: boolean;
}

export function formatResult(
  result: Result,
  fragment: Fragment,
  { decimals, isInput, shorten }: FormatOptions,
  dependencies: TracerDependenciesExtended
) {
  decimals = decimals ?? -1;
  isInput = isInput ?? true;
  shorten = shorten ?? false;
  const stringifiedArgs: Array<[string, string]> = [];
  const params = isInput
    ? fragment.inputs
    : (fragment as FunctionFragment)?.outputs;
  if (!params) {
    return "";
  }
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const name = param.name ?? `arg_${i}`;
    stringifiedArgs.push([
      name,
      decimals !== -1 && i === 2 // display formatted value for erc20 transfer events
        ? formatUnits(result[2], decimals)
        : formatParam(result[i], dependencies),
    ]);
  }
  return `${stringifiedArgs
    .map(
      (entry) =>
        `${
          stringifiedArgs.length > 1 || !shorten ? colorKey(`${entry[0]}=`) : ""
        }${entry[1]}`
    )
    .join(", ")}`;
}
