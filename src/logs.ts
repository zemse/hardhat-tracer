import { EthereumProvider } from "hardhat/src/types/provider";
import { Artifacts } from "hardhat/types";
import { Interface, LogDescription, Result } from "ethers/lib/utils";
import { ethers } from "ethers";
import { JsonFragment } from "@ethersproject/abi";
import chalk from "chalk";

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
              ? stringifyValue(receipt.logs[i].address) + " "
              : ""
          }${name.split(":")[1]}.${chalk.green(parsed.name)}(${formatArgs(
            parsed
          )})`
        );
      } catch {}
    }
  }

  function formatArgs(parsed: LogDescription) {
    const stringifiedArgs: [string, string][] = [];
    for (let i = 0; i < parsed.eventFragment.inputs.length; i++) {
      const input = parsed.eventFragment.inputs[i];
      const name = input.name ?? `arg_${i}`;
      stringifiedArgs.push([name, stringifyValue(parsed.args[i])]);
    }
    return `${stringifiedArgs
      .map((entry) => `${chalk.magenta(`${entry[0]}=`)}${entry[1]}`)
      .join(", ")}`;
  }

  function stringifyValue(value: any): string {
    if (value?._isBigNumber) {
      return ethers.BigNumber.from(value).toString();
    } else if (typeof value === "string" && value.slice(0, 2) !== "0x") {
      return `"${value}"`;
    } else if (
      typeof value === "string" &&
      value.slice(0, 2) === "0x" &&
      value.length === 42
    ) {
      return `${
        addressLabels[value.toLowerCase()]
          ? chalk.italic(`[${addressLabels[value.toLowerCase()]}]`)
          : value
      }`;
    } else if (Array.isArray(value)) {
      return "[" + value.map(stringifyValue).join(", ") + "]";
    } else if (typeof value === "object" && value !== null) {
      // let newObj: any = {};
      console.log("a");

      return (
        "{" +
        Object.entries(value)
          .map((entry) => {
            console.log("b");
            // newObj[entry[0]] = stringifyValue(entry[1]);
            return `${entry[0]}:${stringifyValue(entry[1])}`;
          })
          .join(", ") +
        "}"
      );
    } else {
      return value;
    }
  }
}
