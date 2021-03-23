import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  RequestArguments,
  EIP1193Provider,
  HardhatRuntimeEnvironment,
} from "hardhat/types";
import { printLogs } from "./logs";

/**
 * Wrapped provider which extends requests
 */
export class TracerProvider extends ProviderWrapper {
  hre: HardhatRuntimeEnvironment;

  constructor(provider: EIP1193Provider, hre: HardhatRuntimeEnvironment) {
    super(provider);
    this.hre = hre;
  }

  public async request(args: RequestArguments): Promise<unknown> {
    const result = (await this._wrappedProvider.request(args)) as string;
    if (
      args.method === "eth_sendTransaction" ||
      args.method === "eth_sendRawTransaction"
    ) {
      await printLogs(result, this.hre);
    }
    return result;
  }
}
