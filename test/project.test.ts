// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import path from "path";

import { useEnvironment } from "./helpers";

describe("Integration tests examples", function () {
  describe("Hardhat Runtime Environment extension", function () {
    useEnvironment("hardhat-tracer");

    it("Should add the example field", function () {
      // assert.strictEqual(this.hre.is_hardhat_tracer_active, true);
    });
  });
});
