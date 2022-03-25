import chalk from "chalk";
import { Interface } from "ethers/lib/utils";
import { TracerDependenciesExtended } from "../../types";
import { formatParam } from "./param";
import { formatResult } from "./result";

export async function formatLog(
  log: { data: string; topics: string[] },
  dependencies: TracerDependenciesExtended
) {
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  for (const name of names) {
    const artifact = await dependencies.artifacts.readArtifact(name);
    const iface = new Interface(artifact.abi);

    try {
      const parsed = iface.parseLog(log);
      let decimals = -1;

      return `${chalk.yellow(parsed.name)}(${formatResult(
        parsed.args,
        parsed.eventFragment,
        { decimals, isInput: true, shorten: false },
        dependencies
      )})`;
    } catch {}
  }

  return `${chalk.yellow("UnknownEvent")}(${formatParam(
    log.data,
    dependencies
  )}, ${formatParam(log.topics, dependencies)})`;
}
