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

    it("works", async function () {
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
        v: true,
        // opcodes: ["SSTORE", "SLOAD"].join(","),
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

  describe("Trace call", function () {
    useEnvironment("hardhat-project");

    before(async function () {
      // await this.hre.run("compile");
    });

    it("Should be enabled when specified in config", function () {
      assert.strictEqual(this.hre.tracer.enabled, true);
    });

    it.only("mainnet by rpc", async function () {
      await this.hre.run("compile");
      await this.hre.run("tracecall", {
        to: "0xe592427a0aece92de3edee1f18e0157c05861564",
        data:
          "0x414bf389000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000001f40000000000000000000000000f4ee9631f4be0a63756515141281a3e2b293bbe00000000000000000000000000000000000000000000000000000000627e90ee000000000000000000000000000000000000000000000003244c2a6bb0dc44220000000000000000000000000000000000000000000000000000001be27dca0d0000000000000000000000000000000000000000000000000000000000000000",
        network: "mainnet",
        blocknumber: "14768585",
        // rpc: "https://eth-mainnet.alchemyapi.io/v2/AS_LAx2_WJh1iEAqxd1-AHQ-yb71CiCHF".replace(
        //   "_",
        //   ""
        // ),
        // v: true,
        // opcodes: ["SSTORE", "SLOAD"].join(","),
      });
    });

    it("mainnet by network", async function () {
      await this.hre.run("compile");
      await this.hre.run("tracecall", {
        hash:
          "0xc7f743c1bcd7fddfd6b644f6e5a3a97bdf5a02dfdff180a79f79f7c7481a5b0f",
        network: "mainnet",
      });
    });

    it.skip("arbitrum", async function () {
      await this.hre.run("tracecall", {
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
