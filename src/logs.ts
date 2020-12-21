import { EthereumProvider } from "hardhat/src/types/provider";
import { Artifacts } from "hardhat/types";
import { Interface } from "ethers/lib/utils";
import chalk from "chalk";
import { formatEventArgs, stringifyValue } from "./formatter";

export async function printLogs(
  txHash: string,
  network: EthereumProvider,
  artifacts: Artifacts
) {
  const receipt = await network.send("eth_getTransactionReceipt", [txHash]);
  if (!receipt || !receipt?.logs) return;

  const addressLabels: { [key: string]: string } = {};
  if (typeof receipt.to === "string")
    addressLabels[receipt.to.toLowerCase()] = "Receiver";
  if (typeof receipt.from === "string")
    addressLabels[receipt.from.toLowerCase()] = "Sender";

  const names = await artifacts.getAllFullyQualifiedNames();

  for (let i = 0; i < receipt.logs.length; i++) {
    for (const name of names) {
      const artifact = await artifacts.readArtifact(name);
      const iface = new Interface(artifact.abi);
      // for (const [i, logs] of Object.entries(receipt?.logs)) {

      try {
        const parsed = iface.parseLog(receipt.logs[i]);

        console.log(
          `${
            addressLabels[receipt.logs[i]?.address?.toLowerCase()]
              ? stringifyValue(receipt.logs[i].address, addressLabels) + " "
              : ""
          }${name.split(":")[1]}.${chalk.green(parsed.name)}(${formatEventArgs(
            parsed,
            addressLabels
          )})`
        );
      } catch {}
    }
  }
}
