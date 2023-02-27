import { arrayify, hexStripZeros, hexZeroPad } from "ethers/lib/utils";
import { BigNumber } from "ethers";

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

export function parseBytes32(str: string) {
  return hexZeroPad(hexStripZeros(parseHex(str)), 32);
}

export function parseMemory(strArr: string[]) {
  return arrayify(parseHex(strArr.join("")));
}

export function shallowCopyStack(stack: string[]): string[] {
  return [...stack];
}

export function shallowCopyStack2(stack: bigint[]): string[] {
  return [...stack].map((x) => BigNumber.from(x).toHexString());
}

/**
 * Ensures 0x prefix to a hex string which may or may not
 * @param str A hex string that may or may not have 0x prepended
 */
export function hexPrefix(str: string): string {
  if (!str.startsWith("0x")) str = "0x" + str;
  return str;
}
