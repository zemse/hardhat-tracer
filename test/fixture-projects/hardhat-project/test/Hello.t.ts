import hre from "hardhat";

describe("Contract", function () {
  it("works", async function () {
    const HelloFactory = await hre.ethers.getContractFactory("Hello");
    await HelloFactory.deploy();
  });
});
