import "hardhat/types/config";
import "hardhat/types/runtime";
import { TracerEnv } from "./types";

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    tracer: TracerEnv;
  }
}
