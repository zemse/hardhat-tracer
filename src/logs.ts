import { EthereumProvider } from "hardhat/src/types/provider";
import { Artifacts } from "hardhat/types";
import { Interface } from "ethers/lib/utils";
import chalk from "chalk";
import { formatEventArgs, stringifyValue } from "./formatter";
import { setInAddressLabel } from "./utils";

export async function printLogs(
  txHash: string,
  network: EthereumProvider,
  artifacts: Artifacts
) {
  const receipt = await network.send("eth_getTransactionReceipt", [txHash]);
  if (!receipt || !receipt?.logs) return;

  const addressLabels: { [key: string]: string } = {
    ...global.tracer_name_tags,
  };
  if (typeof receipt.to === "string") {
    setInAddressLabel(addressLabels, receipt.to, "Receiver");
  }

  if (typeof receipt.from === "string") {
    setInAddressLabel(addressLabels, receipt.from, "Sender");
  }

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
            stringifyValue(receipt.logs[i].address, addressLabels) + " "
          }${chalk.green(parsed.name)}(${formatEventArgs(
            parsed,
            addressLabels
          )})`
        );
        break;
      } catch {}
    }
  }
}
