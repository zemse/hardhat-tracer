import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";

import { TracerDependencies } from "../types";

import { compareBytecode } from "./compare-bytecode";

export function getFromNameTags(
  address: string,
  dependencies: TracerDependencies
): string | undefined {
  return (
    dependencies.tracerEnv.nameTags[address] ||
    dependencies.tracerEnv.nameTags[address.toLowerCase()] ||
    dependencies.tracerEnv.nameTags[address.toUpperCase()] ||
    dependencies.tracerEnv.nameTags[ethers.utils.getAddress(address)]
  );
}

export async function fetchContractName(
  to: string,
  dependencies: TracerDependencies
) {
  const { cache } = dependencies.tracerEnv._internal;
  const cacheResult = cache.contractNames.get(to);
  if (cacheResult) {
    if (cacheResult === "unknown") {
      return undefined;
    }
    return cacheResult;
  }

  let name = await fetchContractNameFromMethodName(to, "symbol", dependencies);
  if (!name) {
    name = await fetchContractNameFromMethodName(to, "name", dependencies);
  }

  if (name) {
    // format the name a bit
    name = name.split(" ").join("");
  }
  // set the cache, so we don't do the request again
  cache.contractNames.set(to, name ?? "unknown");
  cache.save();
  return name;
}

export async function fetchContractNameFromMethodName(
  to: string,
  methodName: string,
  dependencies: TracerDependencies
): Promise<string | undefined> {
  const iface1 = new Interface([
    `function ${methodName}() public view returns (string)`,
  ]);
  let result1;
  try {
    const enabled = dependencies.tracerEnv.enabled;
    dependencies.tracerEnv.enabled = false;
    result1 = await dependencies.provider.send("eth_call", [
      { to, data: iface1.encodeFunctionData(methodName, []) },
    ]);
    dependencies.tracerEnv.enabled = enabled;
    const d = iface1.decodeFunctionResult(methodName, result1);
    return d[0];
  } catch {
    try {
      const iface2 = new Interface([
        `function ${methodName}() public view returns (bytes32)`,
      ]);
      const d = iface2.decodeFunctionResult(methodName, result1);
      const bytes32 = d[0];
      return ethers.utils.toUtf8String(bytes32);
    } catch {}
  }
  return undefined;
}

export async function fetchContractDecimals(
  to: string,
  dependencies: TracerDependencies
): Promise<number | undefined> {
  const iface1 = new Interface([
    `function decimals() public view returns (uint8)`,
  ]);
  let result1;
  try {
    const enabled = dependencies.tracerEnv.enabled;
    dependencies.tracerEnv.enabled = false;
    result1 = await dependencies.provider.send("eth_call", [
      { to, data: iface1.encodeFunctionData("decimals", []) },
    ]);
    dependencies.tracerEnv.enabled = enabled;
    const d = iface1.decodeFunctionResult("decimals", result1);
    return d[0];
  } catch {}
  return undefined;
}

export async function fetchContractNameUsingBytecodeComparison(
  address: string,
  dependencies: TracerDependencies
): Promise<string | undefined> {
  const toBytecode = await dependencies.provider.send("eth_getCode", [address]);
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();
  for (const name of names) {
    const _artifact = await dependencies.artifacts.readArtifact(name);

    // try to find the contract name
    if (compareBytecode(_artifact.deployedBytecode, toBytecode) > 0.5) {
      // if bytecode of "to" is the same as the deployed bytecode
      // we can use the artifact name
      return _artifact.contractName;
    }
  }
}

export async function getBetterContractName(
  address: string,
  dependencies: TracerDependencies
): Promise<string | undefined> {
  // 1. See if nameTag exists already
  const nameTag = getFromNameTags(address, dependencies);
  if (nameTag) {
    return nameTag;
  }

  // 2. See if there is a name() method that gives string or bytes32
  dependencies.tracerEnv.enabled = false; // disable tracer to avoid tracing these calls
  const contractNameFromNameMethod = await fetchContractName(
    address,
    dependencies
  );
  dependencies.tracerEnv.enabled = true; // enable tracer back

  if (contractNameFromNameMethod) {
    dependencies.tracerEnv.nameTags[address] = contractNameFromNameMethod;
    return contractNameFromNameMethod;
  }

  // 3. Match bytecode
  const contractNameFromBytecodeComparison = await fetchContractNameUsingBytecodeComparison(
    address,
    dependencies
  );
  if (contractNameFromBytecodeComparison) {
    dependencies.tracerEnv.nameTags[
      address
    ] = contractNameFromBytecodeComparison;
    return contractNameFromBytecodeComparison;
  }
}
