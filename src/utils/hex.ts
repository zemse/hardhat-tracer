import { BigNumber, BigNumberish } from "ethers";
import { arrayify, hexlify, hexStripZeros, hexZeroPad } from "ethers/lib/utils";

/**
 * Ensures 0x prefix to a hex string which may or may not
 * @param str A hex string that may or may not have 0x prepended
 */
export function hexPrefix(str: string) {
  return !str.startsWith("0x") ? "0x" + str : str;
}

export function parseNumber(str: string) {
  return parseUint(str).toNumber();
}

export function parseUint(str: string) {
  return BigNumber.from(hexPrefix(str));
}

export function parseAddress(str: string) {
  return hexZeroPad(hexStripZeros(hexPrefix(str)), 20);
}

export function parseBytes32(str: string) {
  return hexZeroPad(hexStripZeros(hexPrefix(str)), 32);
}

export function parseHex(str: string, bytes?: number) {
  let val = hexStripZeros(hexPrefix(str));
  if (bytes && val.length - 2 < bytes * 2) {
    val = hexZeroPad(val, bytes);
  }
  return val;
}

export function parseMemory(strArr: string[]) {
  return arrayify(hexPrefix(strArr.join("")));
}

export function shallowCopyStack(stack: string[]): string[] {
  return [...stack];
}

export function shallowCopyStack2(stack: Array<bigint>): string[] {
  return [...stack].map((x) => BigNumber.from(x).toHexString());
}

export function toAddr(val: BigNumberish) {
  return hexZeroPad(hexlify(val), 20);
}
