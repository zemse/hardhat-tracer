import { BigNumber } from "ethers";
import { formatUnits, ParamType } from "ethers/lib/utils";

import { Obj, TracerDependencies } from "../types";
import { colorKey } from "../utils/colors";

import { formatParam } from "./param";

interface FormatOptions {
  decimals?: number;
  shorten?: boolean;
}

export function formatResult(
  result: Obj<any>,
  params: ParamType[] | undefined,
  { decimals, shorten }: FormatOptions,
  dependencies: TracerDependencies
) {
  decimals = decimals ?? -1;
  shorten = shorten ?? false;
  let stringifiedArgs: Array<[string, string]> = [];

  if (params) {
    // use abi params to query the keys
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      const name = param.name ?? `arg_${i}`;
      let value;
      if (decimals !== -1 && BigNumber.isBigNumber(result[i])) {
        value = formatUnits(result[i], decimals);
      } else {
        value = formatParam(result[i], dependencies);
      }
      stringifiedArgs.push([name, value]);
    }
  } else {
    // consider all the entries in the object
    stringifiedArgs = Object.entries(result)
      .filter(([key]) => isNaN(Number(key)))
      .map(([key, value]) => [key, formatParam(value, dependencies)]);
  }

  return `${stringifiedArgs
    .map(
      (entry) =>
        `${
          stringifiedArgs.length > 1 || !shorten
            ? colorKey(`${entry[0]}: `)
            : ""
        }${entry[1]}`
    )
    .join(", ")}`;
}
