import createDebug from "debug";
import { ethers } from "ethers";
import { task } from "hardhat/config";

import { print } from "../print";
import { addCliParams, applyCliArgsToTracer } from "../utils";
import { HttpNetworkUserConfig } from "hardhat/types";
import { addRecorder } from "../extend/hre";
const debug = createDebug("hardhat-tracer:tasks:trace");

// TODO
// const originalCreate = VM.create;

// VM.create = async function (...args) {
//   const vm = await originalCreate.bind(VM)(...args);

//   // @ts-ignore
//   const tracerEnv = global.tracerEnv;
//   // @ts-ignore
//   const hreArtifacts = global.hreArtifacts;
//   const recorder = new TraceRecorder(vm, tracerEnv);
//   if (tracerEnv.stateOverrides) {
//     try {
//       await applyStateOverrides(tracerEnv.stateOverrides, vm, hreArtifacts);
//     } catch {}
//   }
//   tracerEnv.recorder = recorder;
//   // @ts-ignore
//   global._hardhat_tracer_recorder = recorder;

//   return vm;
// };

addCliParams(task("trace", "Traces a transaction hash"))
  .addParam("hash", "transaction hash to view trace of")
  .addOptionalParam("rpc", "archive node")
  .setAction(async (args, hre, runSuper) => {
    applyCliArgsToTracer(args, hre);

    // throw new Error(
    //   "trace transaction is currently not supported for hardhat EDR"
    // );

    if (!args.nocompile) {
      await hre.run("compile");
    }

    debug("fetch tx from provider");
    const tx = await hre.network.provider.send("eth_getTransactionByHash", [
      args.hash,
    ]);

    // if tx is not on hardhat local, then use rpc
    if (tx == null) {
      debug("tx not on provider");
      // try using url specified in network as rpc url
      if (args.network) {
        const userNetworks = hre.userConfig.networks;
        if (userNetworks === undefined) {
          throw new Error(
            "[hardhat-tracer]: No networks found in hardhat config"
          );
        }
        if (userNetworks[args.network] === undefined) {
          throw new Error(
            `[hardhat-tracer]: Network ${args.network} not found in hardhat config`
          );
        }
        const url = (userNetworks[args.network] as HttpNetworkUserConfig).url;
        if (url === undefined) {
          throw new Error(
            `[hardhat-tracer]: Url not found in hardhat-config->networks->${args.network}`
          );
        }
        if (args.rpc === undefined) {
          args.rpc = url;
        }
      }

      // try using current mainnet fork url as rpc url
      const mainnetForkUrl = (hre.network.config as any).forking?.url;
      if (mainnetForkUrl && args.rpc === undefined) {
        args.rpc = mainnetForkUrl;
      }

      if (!args.rpc) {
        // TODO add auto-detect network
        throw new Error(
          "[hardhat-tracer]: rpc url not provided, please either use --network <network-name> or --rpc <rpc-url>"
        );
      }
      debug("fetch tx from rpc %s", args.rpc);
      const provider = new ethers.providers.StaticJsonRpcProvider(args.rpc);
      const txFromRpc = await provider.getTransaction(args.hash);

      if (txFromRpc == null) {
        throw new Error(
          "[hardhat-tracer]: Transaction not found on rpc. Are you sure the transaction is confirmed on this network?"
        );
      }

      if (!txFromRpc.blockNumber) {
        throw new Error(
          "[hardhat-tracer]: Transaction is not mined yet, please wait for it to be mined"
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
      addRecorder(hre); // reset seems to clear all what we did to the provider
      // after the above hardhat reset, tx should be present on the local node
    }

    debug("get VM");
    // const node = await getNode(hre);

    // we cant use this resp because stack and memory is not there (takes up lot of memory if enabled)
    // await node.traceTransaction(Buffer.from(args.hash.slice(2), "hex"), {
    //   disableStorage: true,
    //   disableMemory: true,
    //   disableStack: true,
    // });

    debug("trace transaction");
    // const txFinal = await hre.ethers.provider.getTransaction(args.hash);
    // if (!txFinal) {
    //   throw new Error("Transaction is still null, this should not happen");
    // }

    await hre.tracer.switch!.enable();

    console.log(args.hash);
    await hre.network.provider.send("debug_traceTransaction", [args.hash]);
    // await traceTransctionWithProgress(node, args.hash);

    // TODO try to do this properly
    const recorder = hre.tracer.recorder!;

    debug("printing trace");
    await print(recorder.previousTraces[recorder.previousTraces.length - 1], {
      artifacts: hre.artifacts,
      tracerEnv: hre.tracer,
      provider: hre.ethers.provider,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return;
  });

// async function traceTransctionWithProgress(node: HardhatNode, hash: string) {
//   const hashBuffer = Buffer.from(hash.slice(2), "hex");
//   const block = await node.getBlockByTransactionHash(hashBuffer);
//   if (block === undefined) {
//     throw new Error(`Unable to find a block containing transaction ${hash}`);
//   }

//   debug("running block in context");
//   // @ts-ignore
//   return node._runInBlockContext(block.header.number - 1n, async () => {
//     const blockNumber = block.header.number;
//     // @ts-ignore
//     const blockchain = node._blockchain;
//     // @ts-ignore
//     let vm = node._vm;
//     if (
//       typeof blockchain === "object" &&
//       typeof blockchain.getForkBlockNumber === "function" &&
//       blockNumber <= blockchain.getForkBlockNumber()
//     ) {
//       assert(
//         // @ts-ignore
//         node._forkNetworkId !== undefined,
//         "this._forkNetworkId should exist if the blockchain is an instance of ForkBlockchain"
//       );

//       // @ts-ignore
//       const common = node._getCommonForTracing(
//         // @ts-ignore
//         node._forkNetworkId,
//         blockNumber
//       );

//       vm = await VM.create({
//         common,
//         activatePrecompiles: true,
//         // @ts-ignore
//         stateManager: node._vm.stateManager,
//         // @ts-ignore
//         blockchain: node._vm.blockchain,
//       });
//     }

//     // We don't support tracing transactions before the spuriousDragon fork
//     // to avoid having to distinguish between empty and non-existing accounts.
//     // We *could* do it during the non-forked mode, but for simplicity we just
//     // don't support it at all.
//     const isPreSpuriousDragon = !vm.common.gteHardfork("spuriousDragon");
//     if (isPreSpuriousDragon) {
//       throw new Error(
//         "Tracing is not supported for transactions using hardforks older than Spurious Dragon. "
//       );
//     }

//     let currentProgress = 0;
//     let totalProgress = 0;
//     let progressPrinted = Date.now();
//     for (const tx of block.transactions) {
//       totalProgress += Number(tx.gasLimit.toString());
//       if (Buffer.from(tx.hash()).equals(hashBuffer)) {
//         break;
//       }
//     }

//     for (const tx of block.transactions) {
//       let txWithCommon: TypedTransaction;
//       const sender = tx.getSenderAddress();
//       if (tx.type === 0) {
//         txWithCommon = new FakeSenderTransaction(sender, tx, {
//           common: vm.common,
//         });
//       } else if (tx.type === 1) {
//         txWithCommon = new FakeSenderAccessListEIP2930Transaction(sender, tx, {
//           common: vm.common,
//         });
//       } else if (tx.type === 2) {
//         txWithCommon = new FakeSenderEIP1559Transaction(
//           sender,
//           { ...tx, gasPrice: undefined },
//           {
//             common: vm.common,
//           }
//         );
//       } else {
//         // throw new Error("Only legacy, EIP2930, and EIP1559 txs are supported");
//         continue;
//       }

//       const txHash = Buffer.from(txWithCommon.hash());
//       debug("running tx %s", txHash.toString("hex"));
//       if (txHash.equals(hashBuffer)) {
//         await vm.runTx({
//           tx: txWithCommon,
//           block,
//           skipHardForkValidation: true,
//         });
//         return; // stop here and print last trace
//       }
//       await vm.runTx({
//         tx: txWithCommon,
//         block,
//         skipHardForkValidation: true,
//       });
//       currentProgress += Number(tx.gasLimit.toString());
//       if (Date.now() - progressPrinted > 1000) {
//         console.warn(
//           "current progress",
//           Math.floor((currentProgress / totalProgress) * 10000) / 100
//         );
//         progressPrinted = Date.now();
//       }
//     }
//     throw new Error(
//       `Unable to find a transaction in a block that contains that transaction, this should never happen`
//     );
//   });
// }
