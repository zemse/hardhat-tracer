import "hardhat/types/config";
import "hardhat/types/runtime";

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    tracer: {
      nameTags: { [address: string]: string };
      _internal: {
        printNameTagTip:
          | undefined // meaning "no need to print"
          | "print it"
          | "already printed";
      };
    };
  }
}
