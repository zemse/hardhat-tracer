import { BigNumber } from "ethers";
import {
  colorIndexed,
  colorKey,
  colorNameTag,
  colorValue,
  removeNumericFromEthersResult,
} from "../utils";
import { getAddress } from "ethers/lib/utils";
import { getFromNameTags } from "../utils";
import { SEPARATOR } from "../constants";
import { TracerDependencies } from "../types";

export function formatParam(
  value: any,
  dependencies: TracerDependencies
): string {
  if (value?._isBigNumber) {
    return colorValue(BigNumber.from(value).toString());
  } else if (typeof value === "string" && value.slice(0, 2) !== "0x") {
    return colorValue(`"${value}"`);
  } else if (
    typeof value === "string" &&
    value.slice(0, 2) === "0x" &&
    value.length === 42
  ) {
    if (getFromNameTags(value, dependencies)) {
      return colorNameTag(`[${getFromNameTags(value, dependencies)}]`);
    } else {
      if (dependencies.tracerEnv._internal.printNameTagTip === undefined) {
        dependencies.tracerEnv._internal.printNameTagTip = "print it";
      }
      return colorValue(getAddress(value));
    }
  } else if (
    Array.isArray(value) &&
    removeNumericFromEthersResult(value) === null
  ) {
    return (
      "[" + value.map((v) => formatParam(v, dependencies)).join(", ") + "]"
    );
  } else if (value?._isIndexed) {
    return `${colorIndexed("[Indexed]")}${formatParam(
      value.hash,
      dependencies
    )}`;
  } else if (typeof value === "object" && value !== null) {
    const _value = removeNumericFromEthersResult(value);
    return (
      "{" +
      Object.entries(_value)
        .map((entry) => {
          return `${colorKey(entry[0] + SEPARATOR)}${formatParam(
            entry[1],
            dependencies
          )}`;
        })
        .join(", ") +
      "}"
    );
  } else {
    return value;
  }
}
