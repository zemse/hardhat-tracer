import { extendEnvironment } from "hardhat/config";
import "hardhat/types/config";
import "hardhat/types/runtime";
import { getVM } from "../get-vm";
import { TracerEnv } from "../types";
import { TraceRecorder } from "../trace/recorder";
import { Decoder } from "../decoder";
import { hardhatArguments } from "hardhat";

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
  // @ts-ignore
  global.hreArtifacts = hre.artifacts;

  getVM(hre)
    .then((vm) => {
      hre.tracer.recorder = new TraceRecorder(vm, hre.tracer, hre.artifacts);
    })
    .catch(() => {
      // if for some reason we can't get the vm, disable hardhat-tracer
      hre.tracer.enabled = false;
    });
});
