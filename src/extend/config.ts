import createDebug from "debug";
import { extendConfig } from "hardhat/config";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";

import { TracerCache } from "../cache";
import { DEFAULT_VERBOSITY } from "../constants";
import { TracerEnv, TracerEnvUser } from "../types";
import { registerTask } from "../utils";
const debug = createDebug("hardhat-tracer:extend:config");

declare module "hardhat/types/config" {
  export interface HardhatUserConfig {
    tracer?: TracerEnvUser;
  }

  export interface HardhatConfig {
    tracer: TracerEnv;
  }
}

extendConfig(
  (config: HardhatConfig, _userConfig: Readonly<HardhatUserConfig>) => {
    debug("extending config...");
    const userConfigTracer = _userConfig.tracer || {};

    const opcodes = new Map<string, boolean>();

    // always active opcodes
    const opcodesToActivate = [];
    if (userConfigTracer?.opcodes) {
      if (!Array.isArray(userConfigTracer.opcodes)) {
        throw new Error(
          "[hardhat-tracer]: tracer.opcodes in hardhat user config should be array"
        );
      }
      opcodesToActivate.push(...userConfigTracer.opcodes);
    }
    for (const opcode of opcodesToActivate) {
      opcodes.set(opcode, true);
    }

    const cache = new TracerCache();
    cache.setCachePath(config.paths.cache);
    cache.load();

    // NOTE: config that will be mutable should be cloned, since userConfig is immutable
    config.tracer = {
      enabled: userConfigTracer?.enabled ?? false,
      ignoreNext: false,
      printNext: false,
      verbosity: userConfigTracer?.defaultVerbosity ?? DEFAULT_VERBOSITY,
      showAddresses: userConfigTracer?.showAddresses ?? true,
      gasCost: userConfigTracer?.gasCost ?? false,
      enableAllOpcodes: userConfigTracer?.enableAllOpcodes ?? false,
      use4bytesDirectory: userConfigTracer?.use4bytesDirectory ?? true,
      opcodes,
      nameTags: { ...(userConfigTracer?.nameTags ?? {}) }, // mutable
      printMode: "console",
      _internal: {
        printNameTagTip: undefined,
        cache,
      },
      lastTrace() {
        if (this.recorder) {
          return this.recorder.previousTraces[
            this.recorder.previousTraces.length - 1
          ];
        }
      },
      lastTraces(count: number) {
        let traces = this.allTraces();
        if (count > traces.length) {
          throw new Error(
            "[hardhat-tracer]: count is greater than traces available in the recorder"
          );
        }
        let tracesSlice = traces.slice(traces.length - count, traces.length);
        tracesSlice = tracesSlice.reverse();
        return tracesSlice;
      },
      allTraces() {
        return this.recorder?.previousTraces ?? [];
      },
      stateOverrides: userConfigTracer?.stateOverrides, // immutable
    };

    if (userConfigTracer?.tasks) {
      if (!Array.isArray(userConfigTracer?.tasks)) {
        throw new Error(
          "[hardhat-tracer]: tracer.tasks in hardhat user config should be array"
        );
      }

      for (const taskName of userConfigTracer?.tasks) {
        if (typeof taskName !== "string") {
          throw new Error(
            "[hardhat-tracer]: tracer.tasks in hardhat user config should be array of strings"
          );
        }
        registerTask(taskName);
      }
    }
    debug("config extended!");
  }
);
