import { extendEnvironment } from "hardhat/config";
import { JsonRpcRequest, JsonRpcResponse } from "hardhat/types";
import { printLogs } from "./logs";
import "./type-extensions";

extendEnvironment((hre) => {
  const originalSend = hre.network.provider.send;
  async function newSend(method: string, params?: any[]): Promise<any> {
    const result = await originalSend(method, params);
    if (method === "eth_sendTransaction") {
      // TODO: Check if result is a valid bytes32 string
      await printLogs(result, hre.network.provider, hre.artifacts);
    }
    return result;
  }
  hre.network.provider.send = newSend;

  const originalSendAsync = hre.network.provider.sendAsync;
  function newSendAsync(
    payload: JsonRpcRequest,
    callback: (error: any, response: JsonRpcResponse) => void
  ): void {
    console.log("payload", payload);

    return originalSendAsync(payload, callback);
  }
  hre.network.provider.sendAsync = newSendAsync;
});
