import {
  arrayify,
  hexStripZeros,
  hexZeroPad,
  Interface,
} from "ethers/lib/utils";
import { BigNumber, ethers } from "ethers";
import { VM } from "@nomicfoundation/ethereumjs-vm";
import {
  ConfigurableTaskDefinition,
  HardhatRuntimeEnvironment,
} from "hardhat/types";
import { Address } from "@nomicfoundation/ethereumjs-util";
import {
  ProviderLike,
  StateOverrides,
  StructLog,
  TracerDependencies,
  TracerDependenciesExtended,
  TracerEnv,
  TracerEnvUser,
} from "./types";

import {
  getOpcodesForHF,
  Opcode,
} from "@nomicfoundation/ethereumjs-evm/dist/opcodes";
import { Item } from "./trace/transaction";

export function addCliParams(task: ConfigurableTaskDefinition) {
  return (
    task
      // verbosity flags
      .addFlag("v", "set verbosity to 1, prints calls for only failed txs")
      .addFlag(
        "vv",
        "set verbosity to 2, prints calls and storage for only failed txs"
      )
      .addFlag("vvv", "set verbosity to 3, prints calls for all txs")
      .addFlag(
        "vvvv",
        "set verbosity to 4, prints calls and storage for all txs"
      )
      .addFlag("gascost", "display gas cost")
      .addFlag(
        "disabletracer",
        "do not enable tracer at the start (for inline enabling tracer)"
      )

      // params
      .addOptionalParam("opcodes", "specify more opcodes to print")

      // alias
      .addFlag("trace", "enable tracer with verbosity 3")
      .addFlag("fulltrace", "enable tracer with verbosity 4")
  );
}

export const DEFAULT_VERBOSITY = 1;

export function applyCliArgsToTracer(
  args: any,
  hre: HardhatRuntimeEnvironment
) {
  // enabled by default
  hre.tracer.enabled = true;

  // for not enabling tracer from the start
  if (args.disabletracer) {
    hre.tracer.enabled = false;
  }

  // always active opcodes
  const opcodesToActivate = ["RETURN", "REVERT"];

  const logOpcodes = ["LOG0", "LOG1", "LOG2", "LOG3", "LOG4"];
  const storageOpcodes = ["SLOAD", "SSTORE"];

  // setting verbosity
  if (args.vvvv || args.fulltrace) {
    hre.tracer.verbosity = 4;
    opcodesToActivate.push(...logOpcodes, ...storageOpcodes);
  } else if (args.vvv || args.trace) {
    hre.tracer.verbosity = 3;
    opcodesToActivate.push(...logOpcodes);
  } else if (args.vv) {
    hre.tracer.verbosity = 2;
    opcodesToActivate.push(...logOpcodes, ...storageOpcodes);
  } else if (args.v) {
    opcodesToActivate.push(...logOpcodes);
    hre.tracer.verbosity = 1;
  }

  for (const opcode of opcodesToActivate) {
    hre.tracer.opcodes.set(opcode, true);
  }

  if (args.opcodes) {
    // hre.tracer.opcodes = [hre.tracer.opcodes, ...args.opcodes.split(",")];
    for (const opcode of args.opcodes.split(",")) {
      hre.tracer.opcodes.set(opcode, true);
    }

    if (hre.tracer.recorder === undefined) {
      throw new Error(
        `hardhat-tracer/utils/applyCliArgsToTracer: hre.tracer.recorder is undefined`
      );
    }
    checkIfOpcodesAreValid(hre.tracer.opcodes, hre.tracer.recorder.vm);
  }

  if (args.gascost) {
    hre.tracer.gasCost = true;
  }
}

// TODO remove
export function isOnlyLogs(env: TracerEnv): boolean {
  return env.verbosity === 1;
}

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

export function shallowCopyStack2(stack: bigint[]): string[] {
  return [...stack].map((x) => BigNumber.from(x).toHexString());
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

export function removeColor(str: string) {
  return str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}

/**
 * Ensures 0x prefix to a hex string which may or may not
 * @param str A hex string that may or may not have 0x prepended
 */
export function hexPrefix(str: string): string {
  if (!str.startsWith("0x")) str = "0x" + str;
  return str;
}

export function checkIfOpcodesAreValid(opcodes: Map<string, boolean>, vm: VM) {
  // fetch the opcodes which work on this VM
  let activeOpcodesMap = new Map<string, boolean>();
  for (const opcode of getOpcodesForHF(vm._common).opcodes.values()) {
    activeOpcodesMap.set(opcode.fullName, true);
  }

  // check if there are any opcodes specified in tracer which do not work
  for (const opcode of opcodes.keys()) {
    if (!activeOpcodesMap.get(opcode)) {
      throw new Error(
        `The opcode "${opcode}" is not active on this VM. If the opcode name is misspelled in the config, please correct it.`
      );
    }
  }
}

export function isItem(item: any): item is Item<any> {
  return item && typeof item.opcode === "string";
}

export async function applyStateOverrides(
  stateOverrides: StateOverrides,
  vm: VM
) {
  for (const [_address, overrides] of Object.entries(stateOverrides)) {
    const address = Address.fromString(_address);
    // for balance and nonce
    if (overrides.balance !== undefined || overrides.nonce !== undefined) {
      const account = await vm.stateManager.getAccount(address);
      if (overrides.nonce !== undefined) {
        account.nonce = BigNumber.from(overrides.nonce).toBigInt();
      }
      if (overrides.balance) {
        account.balance = BigNumber.from(overrides.balance).toBigInt();
      }
      await vm.stateManager.putAccount(address, account);
    }

    // for bytecode
    if (overrides.bytecode) {
      await vm.stateManager.putContractCode(
        address,
        Buffer.from(overrides.bytecode, "hex")
      );
    }

    // for storage slots
    if (overrides.storage) {
      for (const [key, value] of Object.entries(overrides.storage)) {
        await vm.stateManager.putContractStorage(
          address,
          Buffer.from(
            hexZeroPad(BigNumber.from(key).toHexString(), 32).slice(2),
            "hex"
          ),
          Buffer.from(
            hexZeroPad(BigNumber.from(value).toHexString(), 32).slice(2),
            "hex"
          )
        );
      }
    }
  }
}

export async function fetchContractName(to: string, provider: ProviderLike) {
  let name = await fetchContractNameFromMethodName(to, "symbol", provider);
  if (!name) {
    name = await fetchContractNameFromMethodName(to, "name", provider);
  }
  if (name) {
    name = name.split(" ").join("");
  }
  return name;
}

export async function fetchContractNameFromMethodName(
  to: string,
  methodName: string,
  provider: ProviderLike
): Promise<string | undefined> {
  const iface1 = new Interface([
    `function ${methodName}() public view returns (string)`,
  ]);
  let result1;
  try {
    result1 = await provider.send("eth_call", [
      {
        to,
        data: iface1.encodeFunctionData(methodName, []),
      },
    ]);
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
  provider: ProviderLike
): Promise<number | undefined> {
  const iface1 = new Interface([
    `function decimals() public view returns (uint8)`,
  ]);
  let result1;
  try {
    result1 = await provider.send("eth_call", [
      {
        to,
        data: iface1.encodeFunctionData("decimals", []),
      },
    ]);
    const d = iface1.decodeFunctionResult("decimals", result1);
    return d[0];
  } catch {}
  return undefined;
}
