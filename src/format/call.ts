import { BigNumber, BigNumberish, ethers } from "ethers";
import {
  Fragment,
  FunctionFragment,
  Interface,
  Result,
} from "ethers/lib/utils";
import { Artifact } from "hardhat/types";

import { colorContract, colorFunction, colorKey } from "../colors";
import { ProviderLike, TracerDependencies } from "../types";
import {
  compareBytecode,
  fetchContractDecimals,
  fetchContractName,
  getFromNameTags,
} from "../utils";

import { formatParam } from "./param";
import { formatResult } from "./result";
import { SEPARATOR } from "./separator";

export async function formatCall(
  to: string,
  input: string,
  ret: string,
  value: BigNumberish,
  gas: BigNumberish,
  success: boolean,
  dependencies: TracerDependencies
) {
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  // TODO handle if `to` is console.log address

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
    } = await dependencies.tracerEnv.decoder!.decode(input, ret));

    // use just contract name
    contractName = contractName.split(":")[1];
  } catch {}

  // TODO Find a better contract name
  // 1. See if there is a name() method that gives string or bytes32
  const contractNameFromNameMethod = await fetchContractName(
    to,
    dependencies.provider
  );
  if (contractNameFromNameMethod !== undefined) {
    contractName = contractNameFromNameMethod;
  } else {
    // 2. Match bytecode
    let contractNameFromArtifacts;
    const toBytecode = await dependencies.provider.send("eth_getCode", [to]);
    for (const name of names) {
      const _artifact = await dependencies.artifacts.readArtifact(name);

      // try to find the contract name
      if (
        compareBytecode(_artifact.deployedBytecode, toBytecode) > 0.5 ||
        (to === ethers.constants.AddressZero && toBytecode.length <= 2)
      ) {
        // if bytecode of "to" is the same as the deployed bytecode
        // we can use the artifact name
        contractNameFromArtifacts = _artifact.contractName;
      }

      // if we got both the contract name and arguments parsed so far, we can stop
      if (contractNameFromArtifacts) {
        contractName = contractNameFromArtifacts;
        break;
      }
    }
  }

  if (
    input.slice(0, 10) === "0x70a08231" || // balanceOf
    input.slice(0, 10) === "0xa9059cbb" || // transfer
    input.slice(0, 10) === "0x23b872dd" // transferFrom
  ) {
    contractDecimals = await fetchContractDecimals(to, dependencies.provider);
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
      extra.push(`value${SEPARATOR}${formatParam(value, dependencies)}`);
    }
    if ((gas = BigNumber.from(gas)).gt(0) && dependencies.tracerEnv.gasCost) {
      extra.push(`gas${SEPARATOR}${formatParam(gas, dependencies)}`);
    }
    const nameTag = getFromNameTags(to, dependencies);
    return `${
      nameTag
        ? colorContract(nameTag)
        : contractName
        ? colorContract(contractName)
        : `<${colorContract("UnknownContract")} ${formatParam(
            to,
            dependencies
          )}>`
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
