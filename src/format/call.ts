import { BigNumber, BigNumberish, ethers } from "ethers";
import {
  Fragment,
  FunctionFragment,
  Interface,
  Result,
} from "ethers/lib/utils";
import { Artifact } from "hardhat/types";

import { colorContract, colorFunction, colorKey } from "../colors";
import { TracerDependencies } from "../types";
import { compareBytecode, getFromNameTags } from "../utils";

import { formatParam } from "./param";
import { formatResult } from "./result";
import { SEPARATOR } from "./separator";

export async function formatCall(
  to: string,
  input: string,
  ret: string,
  value: BigNumberish,
  gas: BigNumberish,
  dependencies: TracerDependencies
) {
  // const toBytecode = await dependencies.provider.send("eth_getCode", [to]);
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  // TODO handle if `to` is console.log address

  let contractName: string | undefined;
  let inputResult: Result | undefined;
  let returnResult: Result | undefined;
  let fragment: Fragment | undefined;

  ({
    fragment,
    contractName,
    inputResult,
    returnResult,
  } = await dependencies.tracerEnv.decoder!.decode(input, ret));

  // use just contract name
  contractName = contractName.split(":")[1];

  // TODO Find a better contract name
  // 1. See if there is a name() method that gives string or bytes32
  // 2. Match bytecode

  // for (const name of names) {
  //   const _artifact = await dependencies.artifacts.readArtifact(name);
  //   const iface = new Interface(_artifact.abi);

  //   // try to find the contract name
  //   if (
  //     compareBytecode(_artifact.deployedBytecode, toBytecode) > 0.5 ||
  //     (to === ethers.constants.AddressZero && toBytecode.length <= 2)
  //   ) {
  //     // if bytecode of "to" is the same as the deployed bytecode
  //     // we can use the artifact name
  //     contractName = _artifact.contractName;
  //   }

  //   // if we got both the contract name and arguments parsed so far, we can stop
  //   if (contractName) {
  //     break;
  //   }
  // }

  if (inputResult && fragment) {
    const inputArgs = formatResult(
      inputResult,
      fragment,
      { decimals: -1, isInput: true, shorten: false },
      dependencies
    );
    const outputArgs = returnResult
      ? formatResult(
          returnResult,
          fragment,
          { decimals: -1, isInput: false, shorten: true },
          dependencies
        )
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
