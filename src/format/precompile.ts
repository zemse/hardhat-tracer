import { BigNumber } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

import { Obj, PrecompleResult } from "../types";
import { toAddr } from "../utils";

export function formatPrecompile(
  address: string | undefined,
  input: string,
  ret: string | undefined
): PrecompleResult | null {
  if (!address) {
    return null;
  }
  try {
    switch (address.toLowerCase()) {
      case toAddr(1):
        return {
          name: "ecRecover",
          inputResult: tryDecode(
            ["bytes32 hash", "uint256 v", "uint256 r", "uint256 s"],
            input
          ),
          returnResult: tryDecode(["address signer"], ret),
        };
      case toAddr(2):
        return {
          name: "sha256",
          inputResult: {
            input,
          },
          returnResult: { hash: ret },
        };
      case toAddr(3):
        return {
          name: "ripemd160",
          inputResult: {
            input,
          },
          returnResult: tryDecode(["bytes20 hash"], ret),
        };
      case toAddr(4):
        return {
          name: "identity",
          inputResult: { input },
          returnResult: { ret },
        };
      case toAddr(5):
        return {
          name: "modexp",
          // TODO properly format this
          inputResult: { input },
          returnResult: { ret },
        };
      case toAddr(6):
        return {
          name: "ecAdd",
          inputResult: tryDecode(
            ["uint256 x1", "uint256 y1", "uint256 x2", "uint256 y2"],
            input
          ),
          returnResult: tryDecode(["uint256 x", "uint256 y"], ret),
        };
      case toAddr(7):
        return {
          name: "ecAdd",
          inputResult: tryDecode(
            ["uint256 x1", "uint256 y1", "uint256 s"],
            input
          ),
          returnResult: tryDecode(["uint256 x", "uint256 y"], ret),
        };
      case toAddr(8):
        const inputResult: Obj<any> = {};
        if (input.startsWith("0x")) {
          input = input.slice(2);
        }

        let i = 1;
        while (input.length >= 64) {
          const firstWord = input.slice(0, 32);
          const secondWord = input.slice(32, 64);
          input = input.slice(64);
          inputResult[`x${i}`] = BigNumber.from("0x" + firstWord);
          inputResult[`y${i}`] = BigNumber.from("0x" + secondWord);
          i++;
        }

        if (input) {
          inputResult.unprocessed = input;
        }

        return {
          name: "ecPairing",
          inputResult,
          returnResult: tryDecode(["bool success"], ret),
        };
      case toAddr(9):
        if (input.startsWith("0x")) {
          input = input.slice(2);
        }

        return {
          name: "blake2f",
          inputResult: {
            rounds: Number("0x" + input.slice(0, 8)),
            h: "0x" + input.slice(8, 8 + 128),
            m: "0x" + input.slice(136, 136 + 256),
            t: "0x" + input.slice(392, 392 + 32),
            f: "0x" + input.slice(424, 424 + 2),
          },
          returnResult: { h: ret },
        };
    }
  } catch {}

  return null;
}

function tryDecode(types: any, data: any): Obj<any> | undefined {
  try {
    return defaultAbiCoder.decode(types, data);
  } catch {
    return { data };
  }
}
