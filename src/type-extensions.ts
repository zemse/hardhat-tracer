import "hardhat/types/config";

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    tracer?: TracerConfig;
  }

  interface HardhatConfig {
    tracer: TracerConfig;
  }
}

interface TracerConfig {
  includeCalls?: string[];
}
