import chalk from "chalk";
import { BigNumber } from "ethers";
import { TracerDependenciesExtended } from "../../types";
import { getFromNameTags } from "../../utils";

export function formatParam(
  value: any,
  dependencies: TracerDependenciesExtended
): string {
  if (value?._isBigNumber) {
    return BigNumber.from(value).toString();
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
      "[" + value.map((v) => formatParam(v, dependencies)).join(", ") + "]"
    );
  } else if (value?._isIndexed) {
    return `${chalk.italic("[Indexed]")}${formatParam(
      value.hash,
      dependencies
    )}`;
  } else if (typeof value === "object" && value !== null) {
    return (
      "{" +
      Object.entries(value)
        .map((entry) => {
          return `${entry[0]}:${formatParam(entry[1], dependencies)}`;
        })
        .join(", ") +
      "}"
    );
  } else {
    return value;
  }
}
