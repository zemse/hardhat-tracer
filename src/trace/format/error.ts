import { Interface } from "ethers/lib/utils";

import { colorError } from "../../colors";
import { TracerDependenciesExtended } from "../../types";

import { formatParam } from "./param";
import { formatResult } from "./result";

export async function formatError(
  revertData: string,
  dependencies: TracerDependenciesExtended
) {
  const commonErrors = [
    "function Error(string reason)",
    "function Panic(uint256 code)",
  ];
  try {
    const iface = new Interface(commonErrors);
    const parsed = iface.parseTransaction({
      data: revertData,
    });

    const formatted = formatResult(
      parsed.args,
      parsed.functionFragment,
      { decimals: -1, isInput: true, shorten: false },
      dependencies
    );
    return `${colorError(parsed.name)}(${formatted})`;
  } catch {}

  // if error not common then try to parse it as a custom error
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  for (const name of names) {
    const artifact = await dependencies.artifacts.readArtifact(name);
    const iface = new Interface(artifact.abi);

    try {
      const errorDesc = iface.parseError(revertData);
      return `${colorError(errorDesc.name)}(${formatResult(
        errorDesc.args,
        errorDesc.errorFragment,
        { decimals: -1, isInput: true, shorten: false },
        dependencies
      )})`;
    } catch {}
  }

  return `${colorError("UnknownError")}(${formatParam(
    revertData,
    dependencies
  )})`;
}
