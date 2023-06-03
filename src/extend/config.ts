import structuredClone from "@ungap/structured-clone";
import { extendConfig } from "hardhat/config";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";

import { TracerCache } from "../cache";
import { DEFAULT_VERBOSITY } from "../constants";
import { TracerEnv, TracerEnvUser } from "../types";
import { registerTask } from "../utils";

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
    const userConfig = structuredClone(_userConfig);

    const opcodes = new Map<string, boolean>();

    // always active opcodes
    const opcodesToActivate = [];
    if (userConfig.tracer?.opcodes) {
      if (!Array.isArray(userConfig.tracer.opcodes)) {
        throw new Error(
          "[hardhat-tracer]: tracer.opcodes in hardhat user config should be array"
        );
      }
      opcodesToActivate.push(...userConfig.tracer.opcodes);
    }
    for (const opcode of opcodesToActivate) {
      opcodes.set(opcode, true);
    }

    const cache = new TracerCache();
    cache.setCachePath(config.paths.cache);
    cache.load();

    config.tracer = {
      enabled: userConfig.tracer?.enabled ?? false,
      ignoreNext: false,
      printNext: false,
      verbosity: userConfig.tracer?.defaultVerbosity ?? DEFAULT_VERBOSITY,
      showAddresses: userConfig.tracer?.showAddresses ?? true,
      gasCost: userConfig.tracer?.gasCost ?? false,
      enableAllOpcodes: userConfig.tracer?.enableAllOpcodes ?? false,
      opcodes,
      nameTags: userConfig.tracer?.nameTags ?? {},
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
      stateOverrides: userConfig.tracer?.stateOverrides,
    };

    if (userConfig?.tracer?.tasks) {
      if (!Array.isArray(userConfig?.tracer?.tasks)) {
        throw new Error(
          "[hardhat-tracer]: tracer.tasks in hardhat user config should be array"
        );
      }

      for (const taskName of userConfig?.tracer?.tasks) {
        if (typeof taskName !== "string") {
          throw new Error(
            "[hardhat-tracer]: tracer.tasks in hardhat user config should be array of strings"
          );
        }
        registerTask(taskName);
      }
    }
  }
);
