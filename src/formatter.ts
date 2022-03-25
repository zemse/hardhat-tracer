import chalk from "chalk";
import { Artifact } from "hardhat/types";
import { BigNumber, BigNumberish } from "ethers";
import {
  Fragment,
  FunctionFragment,
  Interface,
  Result,
} from "@ethersproject/abi";
import { formatUnits } from "@ethersproject/units";
import { getFromNameTags } from "./utils";
import { TracerDependenciesExtended } from "./types";

export async function formatContract(
  code: string,
  value: BigNumber,
  salt: BigNumber | null,
  dependencies: TracerDependenciesExtended
) {
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  for (const name of names) {
    const artifact = await dependencies.artifacts.readArtifact(name);
    const iface = new Interface(artifact.abi);

    if (
      artifact.bytecode.length <= code.length &&
      code.slice(0, artifact.bytecode.length) === artifact.bytecode
    ) {
      // we found the code
      try {
        const constructorParamsDecoded = iface._decodeParams(
          iface.deploy.inputs,
          "0x" + code.slice(artifact.bytecode.length)
        );
        const inputArgs = formatResult(
          constructorParamsDecoded,
          iface.deploy,
          { decimals: -1, isInput: true, shorten: false },
          dependencies
        );
        const extra = [];
        if (value.gt(0)) {
          extra.push(`value: ${stringifyValue(value, dependencies)}`);
        }
        if (salt !== null) {
          extra.push(
            `salt: ${stringifyValue(
              salt.gt(1 << 32) ? salt.toHexString() : salt,
              dependencies
            )}`
          );
        }
        return `${chalk.cyan(artifact.contractName)}.${chalk.green(
          "constructor"
        )}${extra.length !== 0 ? `{${extra.join(",")}}` : ""}(${inputArgs})`;
      } catch {}
    }
  }

  return `ContractNotRecognized(codeSize=${code.length})`;
}

export async function formatData(
  to: string,
  input: string,
  ret: string,
  value: BigNumberish,
  gas: BigNumberish,
  dependencies: TracerDependenciesExtended
) {
  // console.log("parse data", { to, input, ret });
  const toBytecode = await dependencies.provider.send("eth_getCode", [to]);
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  let artifact: Artifact | undefined;
  let result: Result | undefined;
  let result2: Result | undefined;
  let functionFragment: FunctionFragment | undefined;
  for (const name of names) {
    const _artifact = await dependencies.artifacts.readArtifact(name);
    const iface = new Interface(_artifact.abi);

    try {
      // if this doesnt throw, we likely found an Artifact that recognizes the input
      const signature = input.slice(0, 10);
      result = iface.decodeFunctionData(signature, input);
      try {
        result2 = iface.decodeFunctionResult(signature, ret);
      } catch {}

      functionFragment = iface.getFunction(signature);
      artifact = _artifact;

      if (toBytecode === _artifact.deployedBytecode) {
        // if bytecode of "to" is the same as the deployed bytecode,
        // it means the Artifact is correct
        break;
      }
    } catch {}
  }

  if (artifact && result && functionFragment) {
    let toAddress = `(${stringifyValue(to, dependencies)})`;
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
      extra.push(`value: ${stringifyValue(value, dependencies)}`);
    }
    if ((gas = BigNumber.from(gas)).gt(0)) {
      extra.push(`gas: ${stringifyValue(gas, dependencies)}`);
    }
    return `${chalk.cyan(artifact.contractName)}${
      "" ?? toAddress
    }.${chalk.green(functionFragment.name)}${
      extra.length !== 0 ? `{${extra.join(",")}}` : ""
    }(${inputArgs})${outputArgs ? ` => (${outputArgs})` : ""}`;
  }

  // TODO add flag to hide unrecognized stuff
  return `FunctionNotRecognized(to=${to}, input=${input}, ret=${ret})`;
}

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

  return `${chalk.yellow("UnknownEvent")}(${stringifyValue(
    log.data,
    dependencies
  )}, ${stringifyValue(log.topics, dependencies)})`;
}

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
    // console.log(parsed, formatted, "hello");
    return `${chalk.red(parsed.name)}(${formatted})`;
  } catch {}

  // if error not common then try to parse it as a custom error
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  for (const name of names) {
    const artifact = await dependencies.artifacts.readArtifact(name);
    const iface = new Interface(artifact.abi);

    try {
      const errorDesc = iface.parseError(revertData);
      return `${chalk.red(errorDesc.name)}(${formatResult(
        errorDesc.args,
        errorDesc.errorFragment,
        { decimals: -1, isInput: true, shorten: false },
        dependencies
      )})`;
    } catch {}
  }

  return `${chalk.red("UnknownError")}(${stringifyValue(
    revertData,
    dependencies
  )})`;
}

interface FormatOptions {
  decimals?: number;
  isInput?: boolean;
  shorten?: boolean;
}

export function formatResult(
  result: Result,
  fragment: Fragment,
  { decimals, isInput, shorten }: FormatOptions,
  dependencies: TracerDependenciesExtended
) {
  decimals = decimals ?? -1;
  isInput = isInput ?? true;
  shorten = shorten ?? false;
  const stringifiedArgs: [string, string][] = [];
  const params = isInput
    ? fragment.inputs
    : (fragment as FunctionFragment)?.outputs;
  if (!params) return "";
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const name = param.name ?? `arg_${i}`;
    stringifiedArgs.push([
      name,
      decimals !== -1 && i === 2 // display formatted value for erc20 transfer events
        ? formatUnits(result[2], decimals)
        : stringifyValue(result[i], dependencies),
    ]);
  }
  return `${stringifiedArgs
    .map(
      (entry) =>
        `${
          stringifiedArgs.length > 1 || !shorten
            ? chalk.magenta(`${entry[0]}=`)
            : ""
        }${entry[1]}`
    )
    .join(", ")}`;
}

export function stringifyValue(
  value: any,
  dependencies: TracerDependenciesExtended
): string {
  if (value?._isBigNumber) {
    return BigNumber.from(value).toString();
  } else if (typeof value === "string" && value.slice(0, 2) !== "0x") {
    return `"${value}"`;
  } else if (
    typeof value === "string" &&
    value.slice(0, 2) === "0x" &&
    value.length === 42
  ) {
    if (getFromNameTags(value, dependencies)) {
      return chalk.italic(`[${getFromNameTags(value, dependencies)}]`);
    } else {
      if (dependencies.tracerEnv._internal.printNameTagTip === undefined) {
        dependencies.tracerEnv._internal.printNameTagTip = "print it";
      }
      return value;
    }
  } else if (Array.isArray(value)) {
    return (
      "[" + value.map((v) => stringifyValue(v, dependencies)).join(", ") + "]"
    );
  } else if (value?._isIndexed) {
    return `${chalk.italic("[Indexed]")}${stringifyValue(
      value.hash,
      dependencies
    )}`;
  } else if (typeof value === "object" && value !== null) {
    // let newObj: any = {};
    // console.log("a", value);

    return (
      "{" +
      Object.entries(value)
        .map((entry) => {
          // console.log("b");
          // newObj[entry[0]] = stringifyValue(entry[1]);
          return `${entry[0]}:${stringifyValue(entry[1], dependencies)}`;
        })
        .join(", ") +
      "}"
    );
  } else {
    return value;
  }
}
