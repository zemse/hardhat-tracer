import { ethers } from "ethers";
import { arrayify } from "ethers/lib/utils";

import { task } from "hardhat/config";
import { getNode } from "../get-vm";
import { printDebugTrace, printDebugTraceOrLogs } from "../print";

import { addCliParams, applyCliArgsToTracer } from "../utils";
import { VM } from "@nomicfoundation/ethereumjs-vm";
import { TraceRecorder } from "../trace/recorder";

const originalCreate = VM.create;

VM.create = async function (...args) {
  const vm = await originalCreate.bind(VM)(...args);
  // const og = vm.runTx;
  // vm.runTx = async function (...args) {
  //   console.log("tx run", args);

  //   const result = await og.bind(vm)(...args);
  //   return result;
  // };
  const recorder = new TraceRecorder(vm);
  // @ts-ignore
  global._hardhat_tracer_recorder = recorder;

  return vm;
};

addCliParams(task("trace", "Traces a transaction hash"))
  .addParam("hash", "transaction hash to view trace of")
  .addOptionalParam("rpc", "archive node")
  .setAction(async (args, hre, runSuper) => {
    applyCliArgsToTracer(args, hre);

    const tx = await hre.network.provider.send("eth_getTransactionByHash", [
      args.hash,
    ]);

    // if tx is not on hardhat local, then use rpc
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
      }

      if (!txFromRpc.blockNumber) {
        throw new Error(
          "Transaction is not mined yet, please wait for it to be mined"
        );
      }

      // try {
      //   console.warn("Trying with rpc");
      //   // await printDebugTrace(args.hash, {
      //   //   provider,
      //   //   tracerEnv: hre.tracer,
      //   //   artifacts: hre.artifacts,
      //   //   nameTags: hre.tracer.nameTags,
      //   // });
      // } catch (error) {
      console.warn(
        "Using debug_tt on rpc failed, activating mainnet fork at block",
        txFromRpc.blockNumber
      );
      await hre.network.provider.send("hardhat_reset", [
        {
          forking: {
            jsonRpcUrl: args.rpc,
            blockNumber: txFromRpc.blockNumber,
          },
        },
      ]);

      const node = await getNode(hre);
      console.log("before trace");

      hre.tracer.enabled = true;

      console.log("hey", args.hash, Buffer.from(args.hash.slice(2), "hex"));
      const steps = await node.traceTransaction(
        Buffer.from(args.hash.slice(2), "hex"),
        {
          disableStorage: true,
          disableMemory: true,
          disableStack: true,
        }
      );
      console.log("after trace");
      // @ts-ignore
      const recorder = (global?._hardhat_tracer_recorder as unknown) as TraceRecorder;
      console.log(recorder.previousTraces[recorder.previousTraces.length - 1]);

      recorder.previousTraces[recorder.previousTraces.length - 1].print({
        artifacts: hre.artifacts,
        tracerEnv: hre.tracer,
        provider: hre.ethers.provider,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
      // }
    }

    // const node = await getNode(hre);
    // console.log(args.hash);

    // await node.traceTransaction(Buffer.from(args.hash, "hex"), {
    //   disableStorage: true,
    //   disableMemory: true,
    //   disableStack: true,
    // });

    return;

    // using hardhat for getting the trace. if tx was previously not found on hardhat local,
    // but now it will be available, due to mainnet fork activation
    console.warn("Trying with hardhat mainnet fork");
    const tracePromise = printDebugTraceOrLogs(args.hash, {
      provider: hre.network.provider,
      tracerEnv: hre.tracer,
      artifacts: hre.artifacts,
      nameTags: hre.tracer.nameTags,
    });

    const delayPromise = new Promise((resolve) => {
      setTimeout(() => resolve("delay"), 20000);
    });

    const resolved = await Promise.race([delayPromise, tracePromise]);
    if (resolved === "delay") {
      console.log(
        "Seems that it is taking time to fetch the state involved. Please note that this process may take several minutes. A lot of eth_getStorageAt requests are currently being made to the rpc."
      );
    }

    const traceResult = await tracePromise;
    if (!traceResult) {
      throw new Error("Transaction could not be traced");
    }
  });
