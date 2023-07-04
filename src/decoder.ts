import createDebug from "debug";
import { ethers } from "ethers";
import {
  ErrorFragment,
  EventFragment,
  fetchJson,
  Fragment,
  FunctionFragment,
  Interface,
  Result,
} from "ethers/lib/utils";
import { Artifacts } from "hardhat/types";

import { TracerCache } from "./cache";
import { I4BytesEntry } from "./types";
const debug = createDebug("hardhat-tracer:decoder");

type Mapping<FragmentType> = Map<
  string,
  Array<{ contractName: string; fragment: FragmentType }>
>;

export class Decoder {
  public functionFragmentsBySelector: Mapping<FunctionFragment> = new Map();
  public errorFragmentsBySelector: Mapping<ErrorFragment> = new Map();
  public eventFragmentsByTopic0: Mapping<EventFragment> = new Map();

  public ready: Promise<void>;

  constructor(
    artifacts: Artifacts,
    public cache: TracerCache,
    public use4bytesDirectory: boolean
  ) {
    debug("Decoder constructor");
    this.ready = this._updateArtifacts(artifacts);
  }

  public async updateArtifacts(artifacts: Artifacts) {
    this.ready = this._updateArtifacts(artifacts);
  }

  public async _updateArtifacts(artifacts: Artifacts) {
    debug("_updateArtifacts called");
    const names = await artifacts.getAllFullyQualifiedNames();
    const everyArtifact = await Promise.all(
      names.map((name) => artifacts.readArtifact(name))
    );

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const artifact = everyArtifact[i];
      const iface = new ethers.utils.Interface(artifact.abi);

      copyFragments(name, iface.functions, this.functionFragmentsBySelector);
      copyFragments(name, iface.errors, this.errorFragmentsBySelector);
      copyFragments(name, iface.events, this.eventFragmentsByTopic0);
    }

    // common errors, these are in function format because Ethers.js does not accept them as errors
    const commonErrors = [
      "function Error(string reason)",
      "function Panic(uint256 code)",
    ];
    const commonErrorsIface = new Interface(commonErrors);
    copyFragments(
      "",
      commonErrorsIface.functions,
      this.errorFragmentsBySelector
    );

    debug("_updateArtifacts finished");
  }

  public async decode(
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
      debug("try decoding as a function");
      return decode(
        inputData,
        returnData,
        "function",
        this.functionFragmentsBySelector,
        this.cache,
        this.use4bytesDirectory
      );
    } catch (e) {
      debug("decoding as a function errored %s", (e as any).message);
    }

    debug("decode as error");
    return decode(
      inputData,
      returnData,
      "error",
      this.errorFragmentsBySelector,
      this.cache,
      this.use4bytesDirectory
    );
  }

  public async decodeFunction(
    inputData: string,
    returnData: string
  ): Promise<{
    fragment: Fragment;
    inputResult: Result;
    returnResult: Result | undefined;
    contractName: string;
  }> {
    await this.ready;

    return decode(
      inputData,
      returnData,
      "function",
      this.functionFragmentsBySelector,
      this.cache,
      this.use4bytesDirectory
    );
  }

  public async decodeError(
    revertData: string
  ): Promise<{
    fragment: Fragment;
    revertResult: Result;
    contractName: string;
  }> {
    await this.ready;

    const { fragment, inputResult, contractName } = await decode(
      revertData,
      "0x",
      "error",
      this.errorFragmentsBySelector,
      this.cache,
      this.use4bytesDirectory
    );
    return { fragment, revertResult: inputResult, contractName };
  }

  public async decodeEvent(
    topics: string[],
    data: string
  ): Promise<{
    fragment: EventFragment;
    result: Result;
    contractName: string;
  }> {
    await this.ready;

    if (topics.length === 0) {
      throw new Error("[hardhat-tracer]: No topics, cannot decode");
    }

    const topic0 = topics[0];
    const fragments = this.eventFragmentsByTopic0.get(topic0);
    if (fragments) {
      for (const { contractName, fragment } of fragments) {
        try {
          const iface = new ethers.utils.Interface([fragment]);
          const result = iface.parseLog({ data, topics });
          return { fragment, result: result.args, contractName };
        } catch {}
      }
    }
    throw decodeError(topic0);
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
  const selector = EventFragment.isEventFragment(fragment)
    ? ethers.utils.Interface.getEventTopic(fragment)
    : ethers.utils.Interface.getSighash(fragment);
  let fragments = mapping.get(selector);
  if (!fragments) {
    mapping.set(selector, (fragments = []));
  }
  // TODO while adding, see if we already have a same signature fragment
  fragments.push({ contractName, fragment });
}

async function decode(
  inputData: string,
  returnData: string,
  type: "function",
  mapping: Mapping<FunctionFragment>,
  cache: TracerCache,
  use4bytesDirectory: boolean
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
  mapping: Mapping<ErrorFragment>,
  cache: TracerCache,
  use4bytesDirectory: boolean
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
  mapping: Mapping<Fragment>,
  cache: TracerCache,
  use4bytesDirectory: boolean
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
  // currently only supports function calls
  if (use4bytesDirectory && type === "function") {
    try {
      debug("decode using 4byte.directory");
      const { fragment, inputResult } = await decodeUsing4byteDirectory(
        selector,
        inputData,
        mapping,
        cache
      );
      return { fragment, inputResult };
    } catch (e) {
      debug("decoding using 4byte.directory errored %s", (e as any).message);
    }
  }

  // we couldn't decode it after even using 4byte.directory, give up
  throw decodeError(selector);
}

async function decodeUsing4byteDirectory(
  selector: string,
  inputData: string,
  mapping: Mapping<Fragment>,
  cache: TracerCache
): Promise<{
  fragment: Fragment;
  inputResult: Result;
}> {
  let responseResults;
  const cacheVal = cache.fourByteDir.get(selector);
  if (cacheVal) {
    responseResults = cacheVal;
  } else {
    const response = await (fetchJson(
      "https://www.4byte.directory/api/v1/signatures/?hex_signature=" + selector
    ) as Promise<{ results: I4BytesEntry[] }>);
    responseResults = response.results;
    cache.fourByteDir.set(selector, responseResults);
    cache.save();
  }

  // sort the results to prefer the oldest entry
  responseResults.sort((a, b) =>
    new Date(a.created_at) < new Date(b.created_at) ? -1 : 1
  );

  for (const result of responseResults) {
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
