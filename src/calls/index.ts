import chalk from "chalk";
import { EthereumProvider, Artifacts, Artifact } from "hardhat/types";
import { formatResult, stringifyValue } from "../formatter";
import { StructLog } from "./interface";
import {
  arrayify,
  hexlify,
  hexStripZeros,
  hexZeroPad,
} from "@ethersproject/bytes";
import { BigNumber, ethers } from "ethers";
import { network } from "hardhat";
import { TracerDependenciesExtended } from "../types";
import { Interface } from "@ethersproject/abi";
import { string } from "hardhat/internal/core/params/argumentTypes";

const DEPTH_INDENTATION = "   ";

export async function printCalls(
  txHash: string,
  dependencies: TracerDependenciesExtended
) {
  try {
    const res = await dependencies.provider.send("debug_traceTransaction", [
      txHash,
    ]);
    const rc = await dependencies.provider.send("eth_getTransactionByHash", [
      txHash,
    ]);
    // console.log(rc);
    if (
      rc.to != null &&
      rc.to != "0x" &&
      rc.to != "0x0000000000000000000000000000000000000000"
    ) {
      console.log(await parseData(rc.to, rc.input, "0x", dependencies));
    } else {
      // contract deploy transaction
      const names = await dependencies.artifacts.getAllFullyQualifiedNames();
      for (const name of names) {
        const artifact = await dependencies.artifacts.readArtifact(name);
        if (artifact.bytecode === rc.input.slice(0, artifact.bytecode.length)) {
          console.log("new", chalk.green(artifact.contractName));
        }
      }
    }

    for (const [i, structLog] of (res.structLogs as StructLog[]).entries()) {
      await printStructLog(structLog, i, res.structLogs, dependencies);
    }
  } catch (error) {
    if ((error as any).message.includes("debug_traceTransaction")) {
      console.log(
        chalk.yellow(`Warning! Debug Transaction not supported on this network`)
      );
    } else {
      console.error(error);
    }
  }
}

async function parseData(
  to: string,
  input: string,
  ret: string,
  dependencies: TracerDependenciesExtended
) {
  // console.log("parse data", { to, input, ret });
  const toBytecode = await dependencies.provider.send("eth_getCode", [to]);
  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  let artifact: Artifact | undefined;
  let result: ethers.utils.Result | undefined;
  let result2: ethers.utils.Result | undefined;
  let functionFragment: ethers.utils.FunctionFragment | undefined;
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
      -1,
      true,
      dependencies
    );
    const outputArgs = result2
      ? formatResult(result2, functionFragment, 0, false, dependencies)
      : "";
    return `${chalk.cyan(artifact.contractName)}${
      "" ?? toAddress
    }.${chalk.green(functionFragment.name)}(${inputArgs})${
      outputArgs ? ` => (${outputArgs})` : ""
    }`;
  }
}

async function printStructLog(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  switch (structLog.op) {
    case "CALL":
      await printCall(structLog, index, structLogs, dependencies);
      break;
    case "STATICCALL":
      await printStaticCall(structLog, index, structLogs, dependencies);
      break;
    case "DELEGATECALL":
      await printDelegateCall(structLog, index, structLogs, dependencies);
      break;
    case "REVERT":
      await printRevert(structLog);
      break;
    default:
      break;
  }
}

async function printCall(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 7) {
    console.log("Faulty CALL");
    return;
  }

  const gas = parseUint(stack.pop()!);
  const to = parseAddress(stack.pop()!);
  const value = parseUint(stack.pop()!);
  const argsOffset = parseNumber(stack.pop()!);
  const argsSize = parseNumber(stack.pop()!);
  const retOffset = parseNumber(stack.pop()!);
  const retSize = parseNumber(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const input = hexlify(memory.slice(argsOffset, argsOffset + argsSize));
  const ret = hexlify(memory.slice(retOffset, retOffset + retSize));

  // console.log("call", structLog);
  // console.log("parsed call", { gas, to, value, input, ret });

  const str = await parseData(to, input, ret, dependencies);
  console.log(DEPTH_INDENTATION.repeat(structLog.depth) + str);
}

async function printStaticCall(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 6) {
    console.log("Faulty STATICCALL");
    return;
  }

  const gas = parseUint(stack.pop()!);
  const to = parseAddress(stack.pop()!);
  // hardhat console.log address
  if (to === "0x000000000000000000636f6e736f6c652e6c6f67") return;
  const argsOffset = parseNumber(stack.pop()!);
  const argsSize = parseNumber(stack.pop()!);
  const retOffset = parseNumber(stack.pop()!);
  const retSize = parseNumber(stack.pop()!);

  // input data
  const input = hexlify(
    parseMemory(structLog.memory).slice(argsOffset, argsOffset + argsSize)
  );

  // return data
  const structLogNext = findNextStructLogInDepth(
    structLogs,
    structLog.depth,
    index + 1 // find next structLog in the same depth
  );
  const ret = hexlify(
    parseMemory(structLogNext.memory).slice(retOffset, retOffset + retSize)
  );

  // console.log("parsed static call", { gas, to, retOffset, retSize, ret });
  const str = await parseData(to, input, ret, dependencies);
  console.log(DEPTH_INDENTATION.repeat(structLog.depth) + str);
}

async function printDelegateCall(
  structLog: StructLog,
  index: number,
  structLogs: StructLog[],
  dependencies: TracerDependenciesExtended
) {
  const stack = shallowCopyStack(structLog.stack);
  if (stack.length <= 6) {
    console.log("Faulty DELEGATECALL");
    return;
  }

  const gas = parseUint(stack.pop()!);
  const to = parseAddress(stack.pop()!);
  // hardhat console.log address
  if (to === "0x000000000000000000636f6e736f6c652e6c6f67") return;
  const argsOffset = parseNumber(stack.pop()!);
  const argsSize = parseNumber(stack.pop()!);
  const retOffset = parseNumber(stack.pop()!);
  const retSize = parseNumber(stack.pop()!);

  const memory = parseMemory(structLog.memory);
  const input = hexlify(memory.slice(argsOffset, argsOffset + argsSize));
  const ret = hexlify(memory.slice(retOffset, retOffset + retSize));

  // console.log("parsed static call", { gas, to, input, ret });
  const str = "(delegate) " + (await parseData(to, input, ret, dependencies));
  console.log(DEPTH_INDENTATION.repeat(structLog.depth) + str);
}

async function printRevert(structLog: StructLog) {
  console.log(DEPTH_INDENTATION.repeat(structLog.depth) + chalk.red("REVERT"));
}

function findNextStructLogInDepth(
  structLogs: StructLog[],
  depth: number,
  startIndex: number
): StructLog {
  for (let i = startIndex; i < structLogs.length; i++) {
    // console.log(i, depth, structLogs[i].depth, structLogs[i].op);

    if (structLogs[i].depth === depth) {
      return structLogs[i];
    }
  }
  throw new Error("Could not find next StructLog in depth");
}

function parseHex(str: string) {
  return !str.startsWith("0x") ? "0x" + str : str;
}

function parseNumber(str: string) {
  return parseUint(str).toNumber();
}

function parseUint(str: string) {
  return BigNumber.from(parseHex(str));
}

function parseAddress(str: string) {
  return hexZeroPad(hexStripZeros(parseHex(str)), 20);
}

function parseMemory(strArr: string[]) {
  return arrayify(parseHex(strArr.join("")));
}

function shallowCopyStack(stack: string[]): string[] {
  return [...stack];
}
