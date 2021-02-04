import { task } from "hardhat/config";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import { printLogs } from "./logs";
import {
  HardhatRuntimeEnvironment,
  JsonRpcRequest,
  JsonRpcResponse,
} from "hardhat/types";
import "./type-extensions";

if (!global._tracer_address_names) global._tracer_address_names = {};

task(TASK_TEST, "Runs mocha tests")
  .addFlag("trace", "trace logs and calls in transactions")
  .addFlag("logs", "print logs emmitted during transactions")
  .setAction(async (args, hre, runSuper) => {
    if (args.trace || args.logs) {
      addLogsPrinterToHre(hre);
    }
    return runSuper(args);
  });

function addLogsPrinterToHre(hre: HardhatRuntimeEnvironment) {
  const originalSend = hre.network.provider.send;
  async function newSend(method: string, params?: any[]): Promise<any> {
    const result = await originalSend(method, params);
    if (method === "eth_sendTransaction") {
      // TODO: Check if result is a valid bytes32 string
      await printLogs(result, hre.network.provider, hre.artifacts);

      /**
       * Temporarily commenting printCalls, since a this needs to be worked on based on hh opcodes
       */
      // try {
      //   await printCalls(result, hre.network.provider, hre.artifacts);
      // } catch (e) {
      //   console.log(e);
      // }
    }
    return result;
  }
  hre.network.provider.send = newSend;

  const originalSendAsync = hre.network.provider.sendAsync;
  function newSendAsync(
    payload: JsonRpcRequest,
    callback: (error: any, response: JsonRpcResponse) => void
  ): void {
    return originalSendAsync(payload, (error, response) => {
      if (payload.method === "eth_sendTransaction") {
        const result = response.result;
        if (result) {
          // TODO: Check if result is a valid bytes32 string
          printLogs(result, hre.network.provider, hre.artifacts).catch(
            console.error
          );
        }
      }
      callback(error, response);
    });
  }
  hre.network.provider.sendAsync = newSendAsync;
  hre.is_hardhat_tracer_active = true;
}
