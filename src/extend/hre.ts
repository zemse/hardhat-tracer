import { extendEnvironment } from "hardhat/config";
import "hardhat/types/config";
import "hardhat/types/runtime";
import { getVM } from "../get-vm";
import { TracerEnv } from "../types";
import { TraceRecorder } from "../trace/recorder";
import { Decoder } from "../decoder";

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    tracer: TracerEnv;
  }
}

extendEnvironment((hre) => {
  // copy reference of config.tracer to tracer
  // TODO take this properly, env can contain things that config does not need to.
  hre.tracer = hre.config.tracer;
  hre.tracer.decoder = new Decoder(hre.artifacts);

  // @ts-ignore
  global.tracerEnv = hre.tracer;

  getVM(hre).then((vm) => {
    hre.tracer.recorder = new TraceRecorder(vm, hre.tracer);
    // vm.on("beforeTx", handleBeforeTx);
    // vm.on("beforeMessage", handleBeforeMessage);
    // vm.on("newContract", handleNewContract);
    // vm.on("step", handleStep);
    // vm.on("afterMessage", handleAfterMessage);
    // vm.on("afterTx", handleAfterTx);
  });
});
