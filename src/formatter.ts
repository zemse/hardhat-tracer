import chalk from "chalk";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";
import { Fragment, FunctionFragment, Result } from "ethers/lib/utils";
import { getFromNameTags } from "./utils";
import { TracerDependenciesExtended } from "./types";

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
  const stringifiedArgs: [string, string][] = [];
  const params = isInput
    ? fragment.inputs
    : (fragment as FunctionFragment)?.outputs;
  if (!params) return "";
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const name = param.name ?? `arg_${i}`;
    stringifiedArgs.push([
      name,
      decimals !== -1 && i === 2 // display formatted value for erc20 transfer events
        ? ethers.utils.formatUnits(result[2], decimals)
        : stringifyValue(result[i], dependencies),
    ]);
  }
  return `${stringifiedArgs
    .map(
      (entry) =>
        `${
          stringifiedArgs.length > 1 || !shorten
            ? chalk.magenta(`${entry[0]}=`)
            : ""
        }${entry[1]}`
    )
    .join(", ")}`;
}

export function stringifyValue(
  value: any,
  dependencies: TracerDependenciesExtended
): string {
  if (value?._isBigNumber) {
    return ethers.BigNumber.from(value).toString();
  } else if (typeof value === "string" && value.slice(0, 2) !== "0x") {
    return `"${value}"`;
  } else if (
    typeof value === "string" &&
    value.slice(0, 2) === "0x" &&
    value.length === 42
  ) {
    if (getFromNameTags(value, dependencies)) {
      return chalk.italic(`[${getFromNameTags(value, dependencies)}]`);
    } else {
      if (dependencies.tracerEnv._internal.printNameTagTip === undefined) {
        dependencies.tracerEnv._internal.printNameTagTip = "print it";
      }
      return value;
    }
  } else if (Array.isArray(value)) {
    return (
      "[" + value.map((v) => stringifyValue(v, dependencies)).join(", ") + "]"
    );
  } else if (value?._isIndexed) {
    return `${chalk.italic("[Indexed]")}${stringifyValue(
      value.hash,
      dependencies
    )}`;
  } else if (typeof value === "object" && value !== null) {
    // let newObj: any = {};
    // console.log("a", value);

    return (
      "{" +
      Object.entries(value)
        .map((entry) => {
          // console.log("b");
          // newObj[entry[0]] = stringifyValue(entry[1]);
          return `${entry[0]}:${stringifyValue(entry[1], dependencies)}`;
        })
        .join(", ") +
      "}"
    );
  } else {
    return value;
  }
}
