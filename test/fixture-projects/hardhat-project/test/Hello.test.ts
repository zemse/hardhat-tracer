import { expect } from "chai";
import { Wallet } from "ethers";
import { parseEther } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";

// process.env.DEBUG = "*";

describe("Hello", () => {
  const wallet = Wallet.createRandom().connect(hre.ethers.provider);
  before(async () => {
    const signers = await hre.ethers.getSigners();
    await signers[0].sendTransaction({
      to: wallet.address,
      value: parseEther("100"),
    });
  });

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
      "0x0000000000000000000000000000001234567890",
      wallet
    );
    // const tx = HelloFactory.getDeployTransaction();
    // const signers = await hre.ethers.getSigners();
    // await signers[0].estimateGas({ ...tx });

    hre.tracer.enabled = true;
    console.log("========> hello.hi2()");
    await hello.hi2([
      { id: 1, id2: 1 },
      { id: 2, id2: 1 },
    ]);
  });

  it("should ignore next", async () => {
    console.log("========> hello.kick()");
    const hello = await hre.ethers.getContractAt(
      "Hello",
      "0x0000000000000000000000000000001234567890",
      wallet
    );
    // hre.tracer.ignoreNext = true;
    try {
      await hello.kick();
    } catch {}

    const estimated = await hello.estimateGas.kick2();
    await hello.kick2({
      gasLimit: estimated,
    });
  });

  it("should run a test and check for message call", async () => {
    hre.tracer.enabled = false;
    // const HelloFactory = await hre.ethers.getContractFactory("Hello", {
    //   libraries: {
    //     Lib: "0x0000000000000000000000000000000000000001",
    //   },
    // });
    // const hello = await HelloFactory.deploy();
    const contract = await hre.ethers.getContractAt(
      "Hello",
      "0x0000000000000000000000000000001234567890",
      wallet
    );
    // const tx = HelloFactory.getDeployTransaction();
    // const signers = await hre.ethers.getSigners();
    // await signers[0].estimateGas({ ...tx });

    hre.tracer.enabled = true;
    console.log("========> hello.hit()");
    await contract.hit(
      {
        name: "hello",
        age: 23,
        props: { id: 12, name: "yello", age: 99 },
      },
      1234,
      { value: parseEther("1") }
    );

    expect(hre.tracer.lastTrace()).to.have.messageCall(
      await contract.populateTransaction.getData(),
      {
        returnData: ethers.utils.defaultAbiCoder.encode(["uint"], ["1234"]),
        from: contract.address,
      }
    );
  });

  it("should do a delegate call under static call", async () => {
    const contract = await hre.ethers.getContractAt(
      "Hello",
      "0x0000000000000000000000000000001234567890",
      wallet
    );
    hre.tracer.printNext = true;
    await contract.firstCall();
  });

  it("should emit an event under a delegate call", async () => {
    const contract = await hre.ethers.getContractAt(
      "Hello",
      "0x0000000000000000000000000000001234567890",
      wallet
    );
    hre.tracer.printNext = true;
    await contract.delegatedShoot();
  });

  it("opcodes", async () => {
    const contract = await hre.ethers.getContractAt(
      "Hello",
      "0x0000000000000000000000000000001234567890",
      wallet
    );
    hre.tracer.printNext = true;
    await contract.playWithOpcodes();
  });

  it("precompiles", async () => {
    const contract = await hre.ethers.getContractAt(
      "Hello",
      "0x0000000000000000000000000000001234567890",
      wallet
    );
    hre.tracer.printNext = true;
    await contract.precompiles({
      gasLimit: 10_000_000,
    });
  });
});
