import "hardhat/types/config";
import "hardhat/types/runtime";

import { ExampleHardhatRuntimeEnvironmentField } from "./ExampleHardhatRuntimeEnvironmentField";

// This file is used to extend Hardhat's types. Most plugins contain a
// src/type-extensions.ts, so we recommend to keep this name.

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
