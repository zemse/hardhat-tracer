import { Interface, LogDescription } from "ethers/lib/utils";
import { Artifact } from "hardhat/types";

import { colorContract, colorEvent } from "../../colors";
import { TracerDependenciesExtended } from "../../types";
import { compareBytecode } from "../../utils";

import { formatParam } from "./param";
import { formatResult } from "./result";

export async function formatLog(
  log: { data: string; topics: string[] },
  currentAddress: string | undefined,
  dependencies: TracerDependenciesExtended
) {
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();
  const code = currentAddress
    ? ((await dependencies.provider.send("eth_getCode", [
        currentAddress,
        "latest",
      ])) as string)
    : undefined;

  let str: string | undefined;
  let contractName: string | undefined;
  for (const name of names) {
    const artifact = await dependencies.artifacts.readArtifact(name);
    const iface = new Interface(artifact.abi);

    // try to find the contract name
    if (compareBytecode(artifact.deployedBytecode, code ?? "0x") > 0.5) {
      contractName = artifact.contractName;
    }

    // try to parse the arguments
    try {
      const parsed = iface.parseLog(log);
      const decimals = -1;

      str = `${colorEvent(parsed.name)}(${formatResult(
        parsed.args,
        parsed.eventFragment,
        { decimals, isInput: true, shorten: false },
        dependencies
      )})`;
    } catch {}

    // if we got both the contract name and arguments parsed so far, we can stop
    if (contractName && str) {
      return colorContract(contractName) + "." + str;
    }
  }

  return (
    `<${colorContract("UnknownContract")} ${currentAddress}>.` + str ??
    `${colorEvent("UnknownEvent")}(${formatParam(
      log.data,
      dependencies
    )}, ${formatParam(log.topics, dependencies)})`
  );
}
