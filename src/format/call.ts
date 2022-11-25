import { BigNumber, BigNumberish } from "ethers";
import { colorContract, colorFunction, colorKey } from "../colors";
import { fetchContractDecimals, getBetterContractName } from "../utils";
import { formatParam } from "./param";
import { formatResult } from "./result";
import {
  formatEther,
  Fragment,
  FunctionFragment,
  Result,
} from "ethers/lib/utils";
import { SEPARATOR } from "./separator";
import { TracerDependencies } from "../types";

export async function formatCall(
  to: string,
  input: string,
  ret: string,
  value: BigNumberish,
  gas: BigNumberish,
  success: boolean,
  dependencies: TracerDependencies
) {
  let contractName: string | undefined;
  let contractDecimals: number | undefined;
  let inputResult: Result | undefined;
  let returnResult: Result | undefined;
  let fragment: Fragment | undefined;

  try {
    ({
      fragment,
      contractName,
      inputResult,
      returnResult,
    } = await dependencies.tracerEnv.decoder!.decodeFunction(input, ret));

    // use just contract name
    contractName = contractName.split(":")[1];
  } catch {}

  // find a better contract name
  const betterContractName = await getBetterContractName(to, dependencies);
  if (betterContractName) {
    contractName = betterContractName;
  } else if (contractName) {
    dependencies.tracerEnv.nameTags[to] = contractName;
  }

  // if ERC20 method found then fetch decimals
  if (
    input.slice(0, 10) === "0x70a08231" || // balanceOf
    input.slice(0, 10) === "0xa9059cbb" || // transfer
    input.slice(0, 10) === "0x23b872dd" // transferFrom
  ) {
    // see if we already know the decimals
    const { tokenDecimalsCache } = dependencies.tracerEnv._internal;
    const decimals = tokenDecimalsCache.get(to);
    if (decimals) {
      // if we know decimals then use it
      contractDecimals = decimals !== -1 ? decimals : undefined;
    } else {
      // otherwise fetch it
      contractDecimals = await fetchContractDecimals(to, dependencies.provider);
      // and cache it
      if (contractDecimals !== undefined) {
        tokenDecimalsCache.set(to, contractDecimals);
      } else {
        tokenDecimalsCache.set(to, -1);
      }
    }
  }

  if (inputResult && fragment) {
    const inputArgs = formatResult(
      inputResult,
      fragment.inputs,
      { decimals: contractDecimals, shorten: false },
      dependencies
    );
    const outputArgs = returnResult
      ? formatResult(
          returnResult,
          (fragment as FunctionFragment).outputs,
          { decimals: contractDecimals, shorten: true },
          dependencies
        )
      : // if return data is not decoded, then show return data only if call was success
      ret !== "0x" && success !== false // success can be undefined
      ? ret
      : "";

    const extra = [];
    if ((value = BigNumber.from(value)).gt(0)) {
      extra.push(`value${SEPARATOR}${formatEther(value)}`);
    }
    if ((gas = BigNumber.from(gas)).gt(0) && dependencies.tracerEnv.gasCost) {
      extra.push(`gas${SEPARATOR}${formatParam(gas, dependencies)}`);
    }

    let nameToPrint = contractName ?? "UnknownContract";

    return `${
      dependencies.tracerEnv.showAddresses || nameToPrint === "UnknownContract"
        ? `${colorContract(nameToPrint)}(${to})`
        : colorContract(nameToPrint)
    }.${colorFunction(fragment.name)}${
      extra.length !== 0 ? `{${extra.join(",")}}` : ""
    }(${inputArgs})${outputArgs ? ` => (${outputArgs})` : ""}`;
  }

  // TODO add flag to hide unrecognized stuff
  if (contractName) {
    return `${colorContract(contractName)}.<${colorFunction(
      "UnknownFunction"
    )}>(${colorKey("input" + SEPARATOR)}${input}, ${colorKey(
      "ret" + SEPARATOR
    )}${ret})`;
  } else {
    return `${colorFunction("UnknownContractAndFunction")}(${colorKey(
      "to" + SEPARATOR
    )}${to}, ${colorKey("input" + SEPARATOR)}${input}, ${colorKey(
      "ret" + SEPARATOR
    )}${ret || "0x"})`;
  }
}
