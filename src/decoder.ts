import { ethers } from "ethers";
import {
  ErrorFragment,
  Fragment,
  FunctionFragment,
  Interface,
  Result,
} from "ethers/lib/utils";
import { string } from "hardhat/internal/core/params/argumentTypes";
import { Artifacts } from "hardhat/types";

type Mapping<FragmentType> = Map<
  string,
  Array<{ contractName: string; fragment: FragmentType }>
>;

export class Decoder {
  functionFragmentsBySelector: Mapping<FunctionFragment> = new Map();
  errorFragmentsBySelector: Mapping<ErrorFragment> = new Map();

  ready: Promise<void>;

  constructor(artifacts: Artifacts) {
    this.ready = this._constructor(artifacts);
  }

  async _constructor(artifacts: Artifacts) {
    const names = await artifacts.getAllFullyQualifiedNames();

    for (const name of names) {
      const artifact = await artifacts.readArtifact(name);
      const iface = new ethers.utils.Interface(artifact.abi);

      copyFragments(name, iface.functions, this.functionFragmentsBySelector);
      copyFragments(name, iface.errors, this.errorFragmentsBySelector);
    }
  }

  async decode(
    inputData: string,
    returnData: string
  ): Promise<{
    fragment: Fragment;
    inputResult: Result;
    returnResult: Result | undefined;
    contractName: string;
  }> {
    await this.ready;

    try {
      return decode(
        inputData,
        returnData,
        "function",
        this.functionFragmentsBySelector
      );
    } catch {}

    return decode(
      inputData,
      returnData,
      "error",
      this.errorFragmentsBySelector
    );
  }
}

function copyFragments(
  contractName: string,
  fragments: { [name: string]: Fragment },
  mapping: Mapping<Fragment>
) {
  for (const fragment of Object.values(fragments)) {
    const selector = ethers.utils.Interface.getSighash(fragment);
    let fragments = mapping.get(selector);
    if (!fragments) {
      mapping.set(selector, (fragments = []));
    }
    fragments.push({ contractName, fragment });
  }
}

function decode(
  inputData: string,
  returnData: string,
  type: "function",
  mapping: Mapping<FunctionFragment>
): {
  fragment: Fragment;
  inputResult: Result;
  returnResult: Result | undefined;
  contractName: string;
};

function decode(
  inputData: string,
  returnData: string,
  type: "error",
  mapping: Mapping<ErrorFragment>
): {
  fragment: Fragment;
  inputResult: Result;
  returnResult: Result | undefined;
  contractName: string;
};

function decode(
  inputData: string,
  returnData: string,
  type: string,
  mapping: Mapping<Fragment>
) {
  const selector = inputData.slice(0, 10);

  const fragments = mapping.get(selector);
  if (!fragments) {
    throw decodeError(selector);
  }

  for (const { fragment, contractName } of fragments) {
    try {
      const iface = new Interface([fragment]);
      if (type === "function") {
        const inputResult = iface.decodeFunctionData(
          inputData.slice(0, 10),
          inputData
        );

        let returnResult: Result | undefined;
        try {
          returnResult = iface.decodeFunctionResult(
            inputData.slice(0, 10),
            returnData
          );
        } catch {}

        return { fragment, inputResult, returnResult, contractName };
      } else if (type === "error") {
        const inputResult = iface.decodeErrorResult(
          fragment as ErrorFragment,
          inputData
        );
        return { fragment, inputResult, contractName };
      }
    } catch {}
  }

  throw decodeError(selector);
}

function decodeError(selector: string) {
  return new Error(
    `Could not decode data for selector ${selector}, no ABI available.`
  );
}
