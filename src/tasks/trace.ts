import { ethers } from "ethers";
import { arrayify } from "ethers/lib/utils";

import { task } from "hardhat/config";
import { getNode } from "../get-vm";
import { printDebugTrace, printDebugTraceOrLogs } from "../print";

import { addCliParams, applyCliArgsToTracer } from "../utils";
import { VM } from "@nomicfoundation/ethereumjs-vm";
import { TraceRecorder } from "../trace/recorder";
import { HttpNetworkUserConfig } from "hardhat/types";

const originalCreate = VM.create;

VM.create = async function (...args) {
  const vm = await originalCreate.bind(VM)(...args);

  // @ts-ignore
  const tracerEnv = global.tracerEnv;
  const recorder = new TraceRecorder(vm, tracerEnv);
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
      // try using url specified in network as rpc url
      if (args.network) {
        const userNetworks = hre.userConfig.networks;
        if (userNetworks === undefined) {
          throw new Error("No networks found in hardhat config");
        }
        if (userNetworks[args.network] === undefined) {
          throw new Error(
            `Network ${args.network} not found in hardhat config`
          );
        }
        const url = (userNetworks[args.network] as HttpNetworkUserConfig).url;
        if (url === undefined) {
          throw new Error(
            `Url not found in hardhat-config->networks->${args.network}`
          );
        }
        args.rpc = url;
      }

      // try using current mainnet fork url as rpc url
      const mainnetForkUrl = (hre.network.config as any).forking?.url;
      if (mainnetForkUrl) {
        args.rpc = mainnetForkUrl;
      }

      if (!args.rpc) {
        // TODO add auto-detect network
        throw new Error(
          "rpc url not provided, please either use --network <network-name> or --rpc <rpc-url>"
        );
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

      // TODO add support for decoding using debug_tt on the RPC if present, otherwise use hardhat mainnet fork
      if (false) {
        // decode response of debug_traceTransaction
        // print
        return; // should halt execution here
      }

      console.warn("Activating mainnet fork at block", txFromRpc.blockNumber);
      await hre.network.provider.send("hardhat_reset", [
        {
          forking: {
            jsonRpcUrl: args.rpc,
            blockNumber: txFromRpc.blockNumber,
          },
        },
      ]);

      // after the above hardhat reset, tx should be present on the local node
    }

    const node = await getNode(hre);

    // we cant use this resp because stack and memory is not there (takes up lot of memory if enabled)
    await node.traceTransaction(Buffer.from(args.hash.slice(2), "hex"), {
      disableStorage: true,
      disableMemory: true,
      disableStack: true,
    });

    // TODO try to do this properly
    // @ts-ignore
    const recorder = (global?._hardhat_tracer_recorder as unknown) as TraceRecorder;

    recorder.previousTraces[recorder.previousTraces.length - 1].print({
      artifacts: hre.artifacts,
      tracerEnv: hre.tracer,
      provider: hre.ethers.provider,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return;
  });
