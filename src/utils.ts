import { BigNumber, ethers } from "ethers";
import { arrayify, hexStripZeros, hexZeroPad } from "ethers/lib/utils";
import {
  ConfigurableTaskDefinition,
  HardhatRuntimeEnvironment,
} from "hardhat/types";

import {
  StructLog,
  TracerDependenciesExtended,
  TracerEnv,
  TracerEnvUser,
} from "./types";

export function getTracerEnvFromUserInput(
  userInput?: TracerEnvUser
): TracerEnv {
  return {
    enabled: userInput?.enabled ?? false,
    logs: userInput?.logs ?? false,
    calls: userInput?.calls ?? false,
    sstores: userInput?.sstores ?? false,
    sloads: userInput?.sloads ?? false,
    gasCost: userInput?.gasCost ?? false,
    opcodes: userInput?.opcodes ?? [],
    nameTags: {},
    _internal: {
      printNameTagTip: undefined,
    },
  };
}

export function addCommonTracerFlagsTo(task: ConfigurableTaskDefinition) {
  return (
    task
      // features
      .addFlag("logs", "print logs emitted during transactions")
      .addFlag("calls", "print calls during transactions")
      .addFlag("sloads", "print SLOADs during calls")
      .addFlag("sstores", "print SSTOREs during transactions")
      .addFlag("gascost", "display gas cost")
      .addFlag(
        "disabletracer",
        "do not enable tracer at the start (for inline enabling tracer)"
      )
      // feature group
      .addFlag("trace", "trace logs and calls in transactions")
      .addFlag(
        "fulltrace",
        "trace logs, calls and storage writes in transactions"
      )
      // aliases
      .addFlag("tracefull", "alias for fulltrace")
      .addFlag("gas", "alias for gascost")
  );
}

export function applyCommonFlagsToTracerEnv(
  args: any,
  hre: HardhatRuntimeEnvironment
) {
  // populating aliases
  const fulltrace = args.fulltrace || args.tracefull;
  const gascost = args.gascost || args.gas;

  // if any flag is present, then enable tracer
  if (args.logs || args.trace || fulltrace || args.disabletracer === true) {
    hre.tracer.enabled = true;
  }

  // enabling config by flags passed
  if (args.logs) {
    hre.tracer.logs = true;
  }
  if (args.calls) {
    hre.tracer.calls = true;
  }
  if (args.sloads) {
    hre.tracer.sloads = true;
  }
  if (args.sstores) {
    hre.tracer.sstores = true;
  }

  // enabling config by mode of operation
  if (args.trace) {
    hre.tracer.logs = true;
    hre.tracer.calls = true;
  }
  if (fulltrace) {
    hre.tracer.logs = true;
    hre.tracer.calls = true;
    hre.tracer.sloads = true;
    hre.tracer.sstores = true;
  }

  if (gascost) {
    hre.tracer.gasCost = true;
  }
}

export function isOnlyLogs(env: TracerEnv): boolean {
  return env.logs && !env.calls && !env.sstores && !env.sloads && !env.gasCost;
}

export function getFromNameTags(
  address: string,
  dependencies: TracerDependenciesExtended
) {
  return (
    dependencies.nameTags[address] ||
    dependencies.nameTags[address.toLowerCase()] ||
    dependencies.nameTags[address.toUpperCase()] ||
    dependencies.nameTags[ethers.utils.getAddress(address)]
  );
}

function replaceIfExists(
  key: string,
  value: string,
  dependencies: TracerDependenciesExtended
) {
  if (
    dependencies.nameTags[key] &&
    !dependencies.nameTags[key].split(" / ").includes(value)
  ) {
    dependencies.nameTags[key] = `${value} / ${dependencies.nameTags[key]}`;
    return true;
  } else {
    return false;
  }
}

export function findNextStructLogInDepth(
  structLogs: StructLog[],
  depth: number,
  startIndex: number
): [StructLog, StructLog] {
  for (let i = startIndex; i < structLogs.length; i++) {
    if (structLogs[i].depth === depth) {
      return [structLogs[i], structLogs[i + 1]];
    }
  }
  throw new Error("Could not find next StructLog in depth");
}

export function parseHex(str: string) {
  return !str.startsWith("0x") ? "0x" + str : str;
}

export function parseNumber(str: string) {
  return parseUint(str).toNumber();
}

export function parseUint(str: string) {
  return BigNumber.from(parseHex(str));
}

export function parseAddress(str: string) {
  return hexZeroPad(hexStripZeros(parseHex(str)), 20);
}

export function parseMemory(strArr: string[]) {
  return arrayify(parseHex(strArr.join("")));
}

export function shallowCopyStack(stack: string[]): string[] {
  return [...stack];
}

export function compareBytecode(
  artifactBytecode: string,
  contractBytecode: string
): number {
  if (artifactBytecode.length <= 2 || contractBytecode.length <= 2) return 0;

  if (typeof artifactBytecode === "string")
    artifactBytecode = artifactBytecode
      .replace(/\_\_\$/g, "000")
      .replace(/\$\_\_/g, "000");

  let matchedBytes = 0;
  for (let i = 0; i < artifactBytecode.length; i++) {
    if (artifactBytecode[i] === contractBytecode[i]) matchedBytes++;
  }
  if (isNaN(matchedBytes / artifactBytecode.length))
    console.log(matchedBytes, artifactBytecode.length);

  return matchedBytes / artifactBytecode.length;
}
