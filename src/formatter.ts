import chalk from "chalk";
import { ethers } from "ethers";
import { LogDescription } from "ethers/lib/utils";

export function formatEventArgs(
  parsed: LogDescription,
  addressLabels: { [key: string]: string }
) {
  const stringifiedArgs: [string, string][] = [];
  for (let i = 0; i < parsed.eventFragment.inputs.length; i++) {
    const input = parsed.eventFragment.inputs[i];
    const name = input.name ?? `arg_${i}`;
    stringifiedArgs.push([name, stringifyValue(parsed.args[i], addressLabels)]);
  }
  return `${stringifiedArgs
    .map((entry) => `${chalk.magenta(`${entry[0]}=`)}${entry[1]}`)
    .join(", ")}`;
}

export function stringifyValue(
  value: any,
  addressLabels: { [key: string]: string }
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
    return `${
      addressLabels[value.toLowerCase()]
        ? chalk.italic(`[${addressLabels[value.toLowerCase()]}]`)
        : value
    }`;
  } else if (Array.isArray(value)) {
    return (
      "[" + value.map((v) => stringifyValue(v, addressLabels)).join(", ") + "]"
    );
  } else if (typeof value === "object" && value !== null) {
    // let newObj: any = {};
    // console.log("a");

    return (
      "{" +
      Object.entries(value)
        .map((entry) => {
          // console.log("b");
          // newObj[entry[0]] = stringifyValue(entry[1]);
          return `${entry[0]}:${stringifyValue(entry[1], addressLabels)}`;
        })
        .join(", ") +
      "}"
    );
  } else {
    return value;
  }
}
