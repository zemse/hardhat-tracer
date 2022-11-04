import {
  extendConfig,
  extendEnvironment,
  experimentalAddHardhatNetworkMessageTraceHook,
} from "hardhat/config";
import { MessageTrace } from "hardhat/internal/hardhat-network/stack-traces/message-trace";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";

import { TracerEnv, TracerEnvUser } from "../types";

declare module "hardhat/types/config" {
  export interface HardhatUserConfig {
    tracer?: TracerEnvUser;
  }

  export interface HardhatConfig {
    tracer: TracerEnv;
  }
}

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    // config.tracer = getTracerEnvFromUserInput(userConfig.tracer);

    const opcodes = new Map<string, boolean>();
    if (userConfig.tracer?.opcodes) {
      if (!Array.isArray(userConfig.tracer.opcodes)) {
        throw new Error(
          "tracer.opcodes in hardhat user config should be array"
        );
      }
      for (const opcode of userConfig.tracer.opcodes) {
        opcodes.set(opcode, true);
      }
    }

    config.tracer = {
      enabled: userConfig.tracer?.enabled ?? false,
      ignoreNext: false,
      verbosity: userConfig.tracer?.defaultVerbosity ?? 1,
      gasCost: userConfig.tracer?.gasCost ?? false,
      opcodes,
      nameTags: userConfig.tracer?.nameTags ?? {},
      // @ts-ignore TODO remove, this has no place in "config"
      _internal: {
        printNameTagTip: undefined,
      },
    };
  }
);
