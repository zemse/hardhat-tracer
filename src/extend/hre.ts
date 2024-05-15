import createDebug from "debug";
import { extendEnvironment } from "hardhat/config";
import "hardhat/types/config";
import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";

import { Decoder } from "../decoder";
import { TraceRecorder } from "../trace-recorder";
import { TracerEnv } from "../types";
import {
  applyStateOverrides,
  getHardhatBaseProvider,
  getVMFromBaseProvider,
} from "../utils";
const debug = createDebug("hardhat-tracer:extend:hre");

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    tracer: TracerEnv;
  }
}

extendEnvironment((hre) => {
  debug("extending environment...");
  // copy reference of config.tracer to tracer
  // TODO take this properly, env can contain things that config does not need to.
  hre.tracer = hre.config.tracer;
  hre.tracer.decoder = new Decoder(
    hre.artifacts,
    hre.tracer._internal.cache,
    hre.tracer.use4bytesDirectory
  );

  // @ts-ignore
  global.tracerEnv = hre.tracer;
  // @ts-ignore
  global.hreArtifacts = hre.artifacts;

  addRecorder(hre).catch(console.error);

  debug("environment extended!");
});

export async function addRecorder(hre: HardhatRuntimeEnvironment) {
  // wait for VM to be initialized
  try {
    const provider = await getHardhatBaseProvider(hre);
    // @ts-ignore
    await provider._setVerboseTracing(true);

    const vm = await getVMFromBaseProvider(provider);

    hre.tracer.recorder = new TraceRecorder(vm, hre.tracer);
    if (hre.tracer.stateOverrides) {
      try {
        await applyStateOverrides(hre.tracer.stateOverrides, vm, hre.artifacts);
      } catch {}
    }
  } catch (e) {
    debug(
      "Could not get VM, hardhat tracer is disabled. Error: " +
        (e as any).message
    );
    // if for some reason we can't get the vm, disable hardhat-tracer
    hre.tracer.enabled = false;
  }
}
