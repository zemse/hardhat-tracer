import "hardhat/types/config";

/**
 * Temporarily commenting TracerConfig, since a network configuration is not needed for now
 * but it might be required later when calls are implemented.
 */
// interface TracerConfig {
//   network: string;
// }

// declare module "hardhat/types/config" {
//   interface HardhatUserConfig {
//     tracer?: TracerConfig;
//   }

//   interface HardhatConfig {
//     tracer: TracerConfig;
//   }
// }

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    is_hardhat_tracer_active: boolean;
  }
}

declare global {
  namespace NodeJS {
    interface Global {
      tracer_name_tags: { [address: string]: string };
    }
  }
}
