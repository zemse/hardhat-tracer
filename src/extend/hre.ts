import { extendEnvironment } from "hardhat/config";
import "hardhat/types/config";
import "hardhat/types/runtime";
import { getVM } from "../get-vm";
import { InterpreterStep } from "@ethereumjs/vm/dist/evm/interpreter";

import { TracerEnv } from "../types";
import {
  // handleAfterMessage,
  // handleAfterTx,
  // handleBeforeMessage,
  // handleBeforeTx,
  // handleNewContract,
  // handleStep,
  TraceRecorder,
} from "../trace/recorder";

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    tracer: TracerEnv;
  }
}

extendEnvironment((hre) => {
  // copy reference of config.tracer to tracer
  console.log("extend env", hre.config.tracer);

  hre.tracer = hre.config.tracer;
  getVM(hre).then((vm) => {
    hre.tracer.recorder = new TraceRecorder(vm);
    // vm.on("beforeTx", handleBeforeTx);
    // vm.on("beforeMessage", handleBeforeMessage);
    // vm.on("newContract", handleNewContract);
    // vm.on("step", handleStep);
    // vm.on("afterMessage", handleAfterMessage);
    // vm.on("afterTx", handleAfterTx);
  });
});
