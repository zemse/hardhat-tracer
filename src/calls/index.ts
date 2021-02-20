import chalk from "chalk";
import { EthereumProvider, Artifacts } from "hardhat/types";
import { stringifyValue } from "../formatter";
import { getCalls } from "./debug_traceTransaction";
import { Call } from "./interface";

export async function printCalls(
  txHash: string,
  network: EthereumProvider,
  artifacts: Artifacts
) {
  const receipt = await network.send("eth_getTransactionReceipt", [txHash]);
  const addressLabels: { [key: string]: string } = {};
  if (typeof receipt.to === "string")
    addressLabels[receipt.to.toLowerCase()] = "Receiver";
  if (typeof receipt.from === "string")
    addressLabels[receipt.from.toLowerCase()] = "Sender";

  try {
    const call = await getCalls(txHash, network);
    // console.log("call", call);

    printCall(call, 0, addressLabels);
  } catch (err) {
    if (err.message.includes("debug_traceTransaction")) {
      console.log(
        chalk.yellow(`Warning! Debug Transaction not supported on this network`)
      );
    } else {
      console.error(err);
    }
  }
}

function printCall(
  call: Call,
  depth: number,
  addressLabels: { [key: string]: string }
) {
  // console.log(
  //   "  ".repeat(depth) +
  //     `${call.type}: ${stringifyValue(call.from, addressLabels)} ${
  //       call.type === "CREATE" || call.type === "CREATE2" ? "deployed" : "to"
  //     } ${stringifyValue(call.to, addressLabels)}`
  // );
  call.calls?.forEach((c) => printCall(c, depth + 1, addressLabels));
}
