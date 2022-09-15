import {
  extendConfig,
  extendEnvironment,
  experimentalAddHardhatNetworkMessageTraceHook,
} from "hardhat/config";
import { MessageTrace } from "hardhat/internal/hardhat-network/stack-traces/message-trace";
import {
  HardhatConfig,
  HardhatUserConfig,
  ExperimentalHardhatNetworkMessageTraceHook,
  HardhatRuntimeEnvironment,
} from "hardhat/types";
import { getVM } from "../get-vm";

import { TracerEnv, TracerEnvUser } from "../types";
import { getTracerEnvFromUserInput } from "../utils";

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
    config.tracer = getTracerEnvFromUserInput(userConfig.tracer);
  }
);

// extendEnvironment((hre: HardhatRuntimeEnvironment) => {
//   getVM(hre).then((vm) => {
//     vm.on("step", () => {
//       console.log("step");
//     });
//   });
// });

// experimentalAddHardhatNetworkMessageTraceHook(
//   async (
//     hre: HardhatRuntimeEnvironment,
//     trace: MessageTrace,
//     isMessageTraceFromACall: boolean
//   ) => {
//     console.log("tracecall", trace.bytecode, isMessageTraceFromACall);
//   }
// );
