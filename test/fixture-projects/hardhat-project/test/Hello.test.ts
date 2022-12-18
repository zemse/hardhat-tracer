import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";

// process.env.DEBUG = "*";

describe("Hello", () => {
  it("should run a test", async () => {
    hre.tracer.enabled = false;
    // const HelloFactory = await hre.ethers.getContractFactory("Hello", {
    //   libraries: {
    //     Lib: "0x0000000000000000000000000000000000000001",
    //   },
    // });
    // const hello = await HelloFactory.deploy();
    const hello = await hre.ethers.getContractAt(
      "Hello",
      "0x0000000000000000000000000000001234567890"
    );
    // const tx = HelloFactory.getDeployTransaction();
    // const signers = await hre.ethers.getSigners();
    // await signers[0].estimateGas({ ...tx });

    hre.tracer.enabled = true;
    console.log("========> hello.hi2()");
    await hello.hi2();
  });

  it.only("should run a test and check for message call", async () => {
    hre.tracer.enabled = false;
    // const HelloFactory = await hre.ethers.getContractFactory("Hello", {
    //   libraries: {
    //     Lib: "0x0000000000000000000000000000000000000001",
    //   },
    // });
    // const hello = await HelloFactory.deploy();
    const hello = await hre.ethers.getContractAt(
      "Hello",
      "0x0000000000000000000000000000001234567890"
    );
    // const tx = HelloFactory.getDeployTransaction();
    // const signers = await hre.ethers.getSigners();
    // await signers[0].estimateGas({ ...tx });

    hre.tracer.enabled = true;
    console.log("========> hello.hit()");
    await hello.hit(
      {
        name: "hello",
        age: 23,
        props: {
          id: 12,
          name: "yello",
          age: 99,
        },
      },
      1234,
      {
        value: parseEther("1"),
      }
    );

    expect(hre.tracer.lastTrace()).to.have.messageCall(
      await hello.populateTransaction.dm2("Heya!", hello.address),
      {
        isDelegateCall: false,
        returnData: ethers.utils.defaultAbiCoder.encode(["string"], ["Heya!"]),
      }
    );

    console.log("========> hello.kick()");
    hre.tracer.ignoreNext = true;
    try {
      await hello.kick();
    } catch {}
    await hello.kick2();
  });
});
