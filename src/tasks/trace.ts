import { ethers } from "ethers";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import { task } from "hardhat/config";

import { addCommonTracerFlagsTo, applyCommonFlagsToTracerEnv } from "../utils";
import { wrapHardhatProvider } from "../wrapper";

addCommonTracerFlagsTo(task("trace", "Traces a transaction hash"))
  .addParam("hash", "transaction hash to view trace of")
  .addOptionalParam("rpc", "archive node")
  .setAction(async (args, hre, runSuper) => {
    applyCommonFlagsToTracerEnv(args, hre);

    const tx = await hre.network.provider.send("eth_getTransactionByHash", [
      args.hash,
    ]);

    if (tx == null) {
      if (!args.rpc) {
        const mainnetForkUrl = (hre.network.config as any).forking?.url;
        if (!mainnetForkUrl) {
          throw new Error(
            "Transaction not found on current network, please pass an archive node with --rpc option"
          );
        }
        args.rpc = mainnetForkUrl;
      }
      const provider = new ethers.providers.StaticJsonRpcProvider(args.rpc);
      const txFromRpc = await provider.getTransaction(args.hash);

      if (txFromRpc == null) {
        throw new Error(
          "Transaction not found on rpc. Are you sure the transaction is confirmed on this network?"
        );
      } else if (!txFromRpc.blockNumber) {
        throw new Error(
          "Transaction is not mined yet, please wait for it to be mined"
        );
      } else {
        await hre.network.provider.send("hardhat_reset", [
          {
            forking: {
              jsonRpcUrl: args.rpc,
              blockNumber: txFromRpc.blockNumber,
            },
          },
        ]);
        console.log("Switched mainnet fork to block", txFromRpc.blockNumber);
      }
    }

    wrapHardhatProvider(hre);
    hre.tracer.enabled = true;

    const delayPromise = new Promise((resolve) => {
      setTimeout(() => resolve("delay"), 20000);
    });
    const tracePromise = hre.network.provider.send(
      "eth_getTransactionReceipt",
      [args.hash]
    );

    const resolved = await Promise.race([delayPromise, tracePromise]);
    if (resolved === "delay") {
      console.log(
        "Seems that it is taking time to fetch the state involved. Please note that this process may take several minutes. A lot of eth_getStorageAt requests are currently being made to the rpc."
      );
    }

    const traceResult = await tracePromise;

    if (traceResult == null) {
      throw new Error("Transaction could not be traced");
    }
  });
