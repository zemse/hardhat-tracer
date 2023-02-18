import { BigNumber } from "ethers";
import { colorKey } from "../utils/colors";
import { formatParam } from "./param";
import { formatUnits, ParamType, Result } from "ethers/lib/utils";
import { TracerDependencies } from "../types";

interface FormatOptions {
  decimals?: number;
  shorten?: boolean;
}

export function formatResult(
  result: Result,
  params: ParamType[] | undefined,
  { decimals, shorten }: FormatOptions,
  dependencies: TracerDependencies
) {
  decimals = decimals ?? -1;
  shorten = shorten ?? false;
  const stringifiedArgs: Array<[string, string]> = [];
  // const params = isInput
  //   ? fragment.inputs
  //   : (fragment as FunctionFragment)?.outputs;
  if (!params) {
    return "";
  }
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const name = param.name ?? `arg_${i}`;
    let value;
    if (decimals !== -1 && BigNumber.isBigNumber(result[i])) {
      value = formatUnits(result[i], decimals);
    } else {
      value = formatParam(result[i], dependencies);
    }

    stringifiedArgs.push([
      name,
      value,
      // use decimals if available to format amount
      // decimals !== -1 && BigNumber.isBigNumber(result[i])
      //   ? formatUnits(result[i], decimals)
      //   : formatParam(result[i], param.components, dependencies),
    ]);
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
