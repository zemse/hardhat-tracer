import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";

declare module "mocha" {
  interface Context {
    hre: HardhatRuntimeEnvironment;
  }
}

export function useEnvironment(projectPath: string) {
  let previousCWD: string;

  beforeEach("Loading hardhat environment", function() {
    previousCWD = process.cwd();
    process.chdir(projectPath);

    this.hre = require("hardhat");
  });

  afterEach("Resetting hardhat", function() {
    resetHardhatContext();
    process.chdir(previousCWD);
  });
}
