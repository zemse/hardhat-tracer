import "hardhat/types/config";
import "hardhat/types/runtime";

export interface NameTags { [address: string]: string }

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    tracer: {
      nameTags: NameTags;
      _internal: {
        printNameTagTip:
          | undefined // meaning "no need to print"
          | "print it"
          | "already printed";
      };
    };
  }
}
