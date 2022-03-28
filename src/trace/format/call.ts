import { BigNumber, BigNumberish } from "ethers";
import { FunctionFragment, Interface, Result } from "ethers/lib/utils";
import { Artifact } from "hardhat/types";

import { colorContract, colorFunction, colorKey } from "../../colors";
import { TracerDependenciesExtended } from "../../types";
import { compareBytecode, getFromNameTags } from "../../utils";

import { formatParam } from "./param";
import { formatResult } from "./result";

export async function formatCall(
  to: string,
  input: string,
  ret: string,
  value: BigNumberish,
  gas: BigNumberish,
  dependencies: TracerDependenciesExtended
) {
  const toBytecode = await dependencies.provider.send("eth_getCode", [to]);
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  let contractName: string | undefined;
  let result: Result | undefined;
  let result2: Result | undefined;
  let functionFragment: FunctionFragment | undefined;
  for (const name of names) {
    const _artifact = await dependencies.artifacts.readArtifact(name);
    const iface = new Interface(_artifact.abi);

    // try to find the contract name
    if (compareBytecode(_artifact.deployedBytecode, toBytecode) > 0.5) {
      // if bytecode of "to" is the same as the deployed bytecode
      // we can use the artifact name
      contractName = _artifact.contractName;
    }

    // try to parse the arguments
    try {
      // if this doesnt throw, we likely found an Artifact that recognizes the input
      const signature = input.slice(0, 10);
      result = iface.decodeFunctionData(signature, input);
      try {
        result2 = iface.decodeFunctionResult(signature, ret);
      } catch {}

      functionFragment = iface.getFunction(signature);
    } catch {}

    // if we got both the contract name and arguments parsed so far, we can stop
    if (contractName && result) {
      break;
    }
  }

  if (result && functionFragment) {
    const inputArgs = formatResult(
      result,
      functionFragment,
      { decimals: -1, isInput: true, shorten: false },
      dependencies
    );
    const outputArgs = result2
      ? formatResult(
          result2,
          functionFragment,
          { decimals: -1, isInput: false, shorten: true },
          dependencies
        )
      : "";

    const extra = [];
    if ((value = BigNumber.from(value)).gt(0)) {
      extra.push(`value: ${formatParam(value, dependencies)}`);
    }
    if ((gas = BigNumber.from(gas)).gt(0) && dependencies.tracerEnv.gasCost) {
      extra.push(`gas: ${formatParam(gas, dependencies)}`);
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
    }.${colorFunction(functionFragment.name)}${
      extra.length !== 0 ? `{${extra.join(",")}}` : ""
    }(${inputArgs})${outputArgs ? ` => (${outputArgs})` : ""}`;
  }

  // TODO add flag to hide unrecognized stuff
  if (contractName) {
    return `${colorContract(contractName)}.<${colorFunction(
      "UnknownFunction"
    )}>(${colorKey("input=")}${input}, ${colorKey("ret=")}${ret})`;
  } else {
    return `${colorFunction("UnknownContractAndFunction")}(${colorKey(
      "to="
    )}${to}, ${colorKey("input=")}${input}, ${colorKey("ret=")}${ret})`;
  }
}
