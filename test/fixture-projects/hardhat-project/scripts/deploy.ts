import hre from "hardhat";

import { wrapHardhatProvider } from "../../../../src/wrapper";

wrapHardhatProvider(hre);
hre.tracer.enabled = true;
hre.tracer.verbosity = 3;

async function main() {
  const Lib = await hre.ethers.deployContract("Lib");
  const Hello = await hre.ethers.deployContract("Hello", {
    libraries: {
      Lib: Lib.address,
    },
  });

  try {
    await Hello.hi2([{ id: 123, id2: 456 }]);
  } catch {
    console.log(hre.tracer.lastTrace()?.top?.params.exception);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

main().catch(console.error);
