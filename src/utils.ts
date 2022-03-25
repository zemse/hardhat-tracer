import { BigNumber, ethers } from "ethers";
import { StructLog, TracerDependenciesExtended } from "./types";
import { arrayify, hexStripZeros, hexZeroPad } from "@ethersproject/bytes";

export function getFromNameTags(
  address: string,
  dependencies: TracerDependenciesExtended
) {
  return (
    dependencies.nameTags[address] ||
    dependencies.nameTags[address.toLowerCase()] ||
    dependencies.nameTags[address.toUpperCase()] ||
    dependencies.nameTags[ethers.utils.getAddress(address)]
  );
}

export function setInNameTags(
  address: string,
  value: string,
  dependencies: TracerDependenciesExtended
) {
  replaceIfExists(address, value, dependencies) ||
    replaceIfExists(address.toLowerCase(), value, dependencies) ||
    replaceIfExists(address.toUpperCase(), value, dependencies) ||
    replaceIfExists(ethers.utils.getAddress(address), value, dependencies) ||
    (dependencies.nameTags[ethers.utils.getAddress(address)] = value);
}

function replaceIfExists(
  key: string,
  value: string,
  dependencies: TracerDependenciesExtended
) {
  if (
    dependencies.nameTags[key] &&
    !dependencies.nameTags[key].split(" / ").includes(value)
  ) {
    dependencies.nameTags[key] = `${value} / ${dependencies.nameTags[key]}`;
    return true;
  } else {
    return false;
  }
}

export function findNextStructLogInDepth(
  structLogs: StructLog[],
  depth: number,
  startIndex: number
): StructLog {
  for (let i = startIndex; i < structLogs.length; i++) {
    // console.log(i, depth, structLogs[i].depth, structLogs[i].op);

    if (structLogs[i].depth === depth) {
      return structLogs[i];
    }
  }
  throw new Error("Could not find next StructLog in depth");
}

export function parseHex(str: string) {
  return !str.startsWith("0x") ? "0x" + str : str;
}

export function parseNumber(str: string) {
  return parseUint(str).toNumber();
}

export function parseUint(str: string) {
  return BigNumber.from(parseHex(str));
}

export function parseAddress(str: string) {
  return hexZeroPad(hexStripZeros(parseHex(str)), 20);
}

export function parseMemory(strArr: string[]) {
  return arrayify(parseHex(strArr.join("")));
}

export function shallowCopyStack(stack: string[]): string[] {
  return [...stack];
}
