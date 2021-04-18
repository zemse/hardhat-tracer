import { EthereumProvider } from "hardhat/src/types/provider";
import { Artifacts, HardhatRuntimeEnvironment } from "hardhat/types";
import { Interface } from "ethers/lib/utils";
import chalk from "chalk";
import { formatEventArgs, stringifyValue } from "./formatter";
import { setInNameTags } from "./utils";

export async function printLogs(
  txHash: string,
  hre: HardhatRuntimeEnvironment
) {
  const receipt = await hre.network.provider.send("eth_getTransactionReceipt", [
    txHash,
  ]);
  if (!receipt || !receipt?.logs) return;

  const nameTags = {...hre.tracer.nameTags};

  if (typeof receipt.to === "string") {
    setInNameTags(receipt.to, "Receiver", nameTags);
  }

  if (typeof receipt.from === "string") {
    setInNameTags(receipt.from, "Sender", nameTags);
  }

  const names = await hre.artifacts.getAllFullyQualifiedNames();

  for (let i = 0; i < receipt.logs.length; i++) {
    for (const name of names) {
      const artifact = await hre.artifacts.readArtifact(name);
      const iface = new Interface(artifact.abi);

      try {
        const parsed = iface.parseLog(receipt.logs[i]);
        let decimals = -1;
        if (parsed.signature === "Transfer(address,address,uint256)") {
          try {
            const res = await hre.network.provider.send("eth_call", [
              { data: "0x313ce567", to: receipt.logs[i].address },
            ]);
            decimals = +res;
          } catch {}
        }

        console.log(
          `${stringifyValue(receipt.logs[i].address, hre, nameTags) + " "}${chalk.green(
            parsed.name
          )}(${formatEventArgs(parsed, decimals, hre, nameTags)})`
        );
        break;
      } catch {}
    }
  }

  if (hre.tracer._internal.printNameTagTip === "print it") {
    hre.tracer._internal.printNameTagTip = "already printed";
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
