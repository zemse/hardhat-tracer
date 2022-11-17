// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import path from "path";

import { useEnvironment } from "./helpers";

describe("Hardhat Runtime Environment extension", function () {
  describe("Test task", function () {
    useEnvironment("hardhat-project");

    // before(async function () {
    //   await this.hre.run("compile");
    // });

    it.only("works", async function () {
      await this.hre.run("compile");
      await this.hre.run("test", {
        fulltrace: true,
        // opcodes: "SSTORE,SLOAD",
      });
    });
  });

  describe("Trace task", function () {
    useEnvironment("hardhat-project");

    before(async function () {
      // await this.hre.run("compile");
    });

    it("Should be enabled when specified in config", function () {
      assert.strictEqual(this.hre.tracer.enabled, true);
    });

    it("mainnet by rpc", async function () {
      await this.hre.run("compile");
      await this.hre.run("trace", {
        hash:
          "0xc645204e28ffc9f75812e598c6ee7a959c501756062195b2f0fb003276fa39a7",
        rpc: "https://eth-mainnet.alchemyapi.io/v2/AS_LAx2_WJh1iEAqxd1-AHQ-yb71CiCHF".replace(
          "_",
          ""
        ),
        opcodes: ["SSTORE", "SLOAD"].join(","),
      });
    });

    it("mainnet by network", async function () {
      await this.hre.run("compile");
      await this.hre.run("trace", {
        hash:
          "0xc7f743c1bcd7fddfd6b644f6e5a3a97bdf5a02dfdff180a79f79f7c7481a5b0f",
        network: "mainnet",
      });
    });

    it.skip("arbitrum", async function () {
      await this.hre.run("trace", {
        hash:
          "0x64e36ed3441bae0ed9b1ce685cb14791806a857038a094753943007df3d74bc5",
        rpc: "https://arb-mainnet.g.alchemy.com/v2/AS_LAx2_WJh1iEAqxd1-AHQ-yb71CiCHF".replace(
          "_",
          ""
        ),
      });
    });
  });
});
