import chalk from "chalk";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";
import { LogDescription } from "ethers/lib/utils";
import { getFromNameTags } from "./utils";

export function formatEventArgs(
  parsed: LogDescription,
  decimals: number,
  hre: HardhatRuntimeEnvironment
) {
  const stringifiedArgs: [string, string][] = [];
  for (let i = 0; i < parsed.eventFragment.inputs.length; i++) {
    const input = parsed.eventFragment.inputs[i];
    const name = input.name ?? `arg_${i}`;
    stringifiedArgs.push([
      name,
      decimals !== -1 && i === 2 // display formatted value for erc20 transfer events
        ? ethers.utils.formatUnits(parsed.args[2], decimals)
        : stringifyValue(parsed.args[i], hre),
    ]);
  }
  return `${stringifiedArgs
    .map((entry) => `${chalk.magenta(`${entry[0]}=`)}${entry[1]}`)
    .join(", ")}`;
}

export function stringifyValue(
  value: any,
  hre: HardhatRuntimeEnvironment
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
    if (getFromNameTags(value, hre)) {
      return chalk.italic(`[${getFromNameTags(value, hre)}]`);
    } else {
      if (hre.tracer._internal.printNameTagTip === undefined) {
        hre.tracer._internal.printNameTagTip = "print it";
      }
      return value;
    }
  } else if (Array.isArray(value)) {
    return "[" + value.map((v) => stringifyValue(v, hre)).join(", ") + "]";
  } else if (typeof value === "object" && value !== null) {
    // let newObj: any = {};
    // console.log("a");

    return (
      "{" +
      Object.entries(value)
        .map((entry) => {
          // console.log("b");
          // newObj[entry[0]] = stringifyValue(entry[1]);
          return `${entry[0]}:${stringifyValue(entry[1], hre)}`;
        })
        .join(", ") +
      "}"
    );
  } else {
    return value;
  }
}
