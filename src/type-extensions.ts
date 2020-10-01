// If your plugin depends on other plugins, you should add their triple-slash references here.
// See https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html#-reference-types-

// To extend one of Hardhat's types, you need to import the module where it has been defined, and redeclare it.
import "hardhat/types/config";
import "hardhat/types/runtime";

import { ExampleHardhatRuntimeEnvironmentField } from "./ExampleHardhatRuntimeEnvironmentField";

declare module "hardhat/types/config" {
  // This is an example of an extension to one of the Hardhat config values.
  export interface ProjectPaths {
    newPath?: string;
  }
}

declare module "hardhat/types/runtime" {
  // This is an example of an extension to the Hardhat Runtime Environment.
  // This new field will be available in tasks' actions, scripts, and tests.
  export interface HardhatRuntimeEnvironment {
    example: ExampleHardhatRuntimeEnvironmentField;
  }
}
