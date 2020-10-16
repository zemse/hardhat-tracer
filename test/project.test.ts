// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";

import { ExampleHardhatRuntimeEnvironmentField } from "../src/ExampleHardhatRuntimeEnvironmentField";

import { useEnvironment } from "./helpers";

describe("Integration tests examples", function() {
  describe("Hardhat Runtime Environment extension", function() {
    useEnvironment("hardhat-project");

    it("It should add the example field", function() {
      assert.instanceOf(
        this.hre.example,
        ExampleHardhatRuntimeEnvironmentField
      );
    });

    it("The example filed should say hello", function() {
      assert.equal(this.hre.example.sayHello(), "hello");
    });
  });
});

describe("Unit tests examples", function() {
  describe("ExampleHardhatRuntimeEnvironmentField", function() {
    describe("sayHello", function() {
      it("Should say hello", function() {
        const field = new ExampleHardhatRuntimeEnvironmentField();
        assert.equal(field.sayHello(), "hello");
      });
    });
  });
});
