import { Interface, LogDescription } from "ethers/lib/utils";
import { Artifact } from "hardhat/types";
import { TracerDependenciesExtended } from "../../types";
import { colorContract, colorEvent } from "../colors";
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

  let strPrevious: string | undefined;
  for (const name of names) {
    const artifact = await dependencies.artifacts.readArtifact(name);
    const iface = new Interface(artifact.abi);

    try {
      const parsed = iface.parseLog(log);
      let decimals = -1;

      const str = `${colorEvent(parsed.name)}(${formatResult(
        parsed.args,
        parsed.eventFragment,
        { decimals, isInput: true, shorten: false },
        dependencies
      )})`;

      if (
        artifact.deployedBytecode ===
        code?.slice(0, artifact.deployedBytecode.length)
      ) {
        return colorContract(artifact.contractName) + "." + str;
      }
      strPrevious = str;
    } catch {}
  }

  return (
    `<UnknownContract ${currentAddress}>.` + strPrevious ??
    `${colorEvent("UnknownEvent")}(${formatParam(
      log.data,
      dependencies
    )}, ${formatParam(log.topics, dependencies)})`
  );
}
