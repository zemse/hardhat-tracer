import "hardhat/types/config";

interface TracerConfig {
  network: string;
}

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    tracer?: TracerConfig;
  }

  interface HardhatConfig {
    tracer: TracerConfig;
  }
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    is_hardhat_tracer_active: boolean;
  }
}
