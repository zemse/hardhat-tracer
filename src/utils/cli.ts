import { checkIfOpcodesAreValid } from "./check-opcodes";
import {
  ConfigurableTaskDefinition,
  HardhatRuntimeEnvironment,
} from "hardhat/types";

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

    // if recorder was already created, then check opcodes, else it will be checked later
    if (hre.tracer.recorder !== undefined) {
      checkIfOpcodesAreValid(hre.tracer.opcodes, hre.tracer.recorder.vm);
    }
  }

  if (args.gascost) {
    hre.tracer.gasCost = true;
  }
}
