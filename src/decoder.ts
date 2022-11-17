import { ethers } from "ethers";
import {
  ErrorFragment,
  fetchJson,
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
    addFragmentToMapping(contractName, fragment, mapping);
  }
}

function addFragmentToMapping(
  contractName: string,
  fragment: Fragment,
  mapping: Mapping<Fragment>
) {
  const selector = ethers.utils.Interface.getSighash(fragment);
  let fragments = mapping.get(selector);
  if (!fragments) {
    mapping.set(selector, (fragments = []));
  }
  fragments.push({ contractName, fragment });
}

async function decode(
  inputData: string,
  returnData: string,
  type: "function",
  mapping: Mapping<FunctionFragment>
): Promise<{
  fragment: Fragment;
  inputResult: Result;
  returnResult: Result | undefined;
  contractName: string;
}>;

async function decode(
  inputData: string,
  returnData: string,
  type: "error",
  mapping: Mapping<ErrorFragment>
): Promise<{
  fragment: Fragment;
  inputResult: Result;
  returnResult: Result | undefined;
  contractName: string;
}>;

async function decode(
  inputData: string,
  returnData: string,
  type: string,
  mapping: Mapping<Fragment>
) {
  const selector = inputData.slice(0, 10);
  // console.log("selector", selector);

  // if we have a local fragment for this selector, try using it
  const fragments = mapping.get(selector);
  if (fragments) {
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
  }

  // we couldn't decode it using local ABI, try 4byte.directory
  try {
    const { fragment, inputResult } = await decodeUsing4byteDirectory(
      selector,
      inputData,
      mapping
    );
    return { fragment, inputResult };
  } catch {}

  // we couldn't decode it after even using 4byte.directory, give up
  throw decodeError(selector);
}

async function decodeUsing4byteDirectory(
  selector: string,
  inputData: string,
  mapping: Mapping<Fragment>
): Promise<{
  fragment: Fragment;
  inputResult: Result;
}> {
  const response = await fetchJson(
    "https://www.4byte.directory/api/v1/signatures/?hex_signature=" + selector
  );
  // console.log("response", response);

  for (const result of response.results) {
    // console.log({ result });

    try {
      const iface = new Interface(["function " + result.text_signature]);

      const inputResult = iface.decodeFunctionData(
        inputData.slice(0, 10),
        inputData
      );

      // there's some weird Node.js bug, error from above line doesn't get catched by try/catch
      // the following line looks inside inputResult, so Node.js has to resolve it.
      for (const _ of inputResult) {
      }

      // cache the fragment for next time (within the same run)
      const fragment = iface.getFunction(result.text_signature);
      // console.log(fragment);

      addFragmentToMapping("", fragment, mapping);

      return { fragment, inputResult };
    } catch (E) {
      // console.log("error xyzzz", E);
    }
  }

  throw decodeError(selector);
}

function decodeError(selector: string) {
  return new Error(
    `Could not decode data for selector ${selector}, no ABI available.`
  );
}
