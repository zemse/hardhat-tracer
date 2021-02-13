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
    ...global.TRACER_NAME_TAGS,
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
        let decimals = -1;
        if (parsed.signature === "Transfer(address,address,uint256)") {
          try {
            const res = await network.send("eth_call", [
              { data: "0x313ce567", to: receipt.logs[i].address },
            ]);
            decimals = +res;
          } catch {}
        }

        console.log(
          `${
            stringifyValue(receipt.logs[i].address, addressLabels) + " "
          }${chalk.green(parsed.name)}(${formatEventArgs(
            parsed,
            addressLabels,
            decimals
          )})`
        );
        break;
      } catch {}
    }
  }
  if (global.__tracerPrintNameTagTip === "print it") {
    global.__tracerPrintNameTagTip = "already printed";
    // print only occassionally (20% probability)
    if (Math.random() < 0.2) {
      console.log(
        chalk.yellow(
          `Tip: You can set name tags for addresses by adding a key to global.tracer_name_tags object`
        )
      );
    }
  }
}
