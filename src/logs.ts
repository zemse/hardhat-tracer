import { EthereumProvider } from "hardhat/src/types/provider";
import { Artifacts } from "hardhat/types";
import { Interface } from "ethers/lib/utils";
import chalk from "chalk";
import { formatEventArgs, stringifyValue } from "./formatter";
import { setInNameTags } from "./utils";
import { TracerDependenciesExtended } from "./types";

export async function printLogs(
  txHash: string,
  receipt: any | null,
  dependencies: TracerDependenciesExtended
) {
  if (!txHash) return;
  if (!receipt)
    receipt = await dependencies.provider.send("eth_getTransactionReceipt", [
      txHash,
    ]);
  if (!receipt || !receipt.logs) return;

  if (typeof receipt.to === "string") {
    setInNameTags(receipt.to, "Receiver", dependencies);
  }

  if (typeof receipt.from === "string") {
    setInNameTags(receipt.from, "Sender", dependencies);
  }

  const names = await dependencies.artifacts.getAllFullyQualifiedNames();

  for (let i = 0; i < receipt.logs.length; i++) {
    for (const name of names) {
      const artifact = await dependencies.artifacts.readArtifact(name);
      const iface = new Interface(artifact.abi);

      try {
        const parsed = iface.parseLog(receipt.logs[i]);
        let decimals = -1;
        if (parsed.signature === "Transfer(address,address,uint256)") {
          try {
            const res = await dependencies.provider.send("eth_call", [
              { data: "0x313ce567", to: receipt.logs[i].address },
            ]);
            decimals = +res.slice(0, 66);
          } catch {}
        }

        console.log(
          `${
            stringifyValue(receipt.logs[i].address, dependencies) + " "
          }${chalk.green(parsed.name)}(${formatEventArgs(
            parsed,
            decimals,
            dependencies
          )})`
        );
        break;
      } catch {}
    }
  }

  if (dependencies.tracerEnv._internal.printNameTagTip === "print it") {
    dependencies.tracerEnv._internal.printNameTagTip = "already printed";
    // print only occassionally (20% probability)
    if (Math.random() < 0.2) {
      console.log(
        chalk.yellow(
          `Tip: You can set name tags for addresses by adding a key to hre.tracer.nameTags object in your test cases.\ne.g. hre.tracer.nameTags["0x1234567890123456789012345678901234567890"] = "MyTreasury";`
        )
      );
    }
  }
}
