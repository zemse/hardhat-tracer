import { ethers } from "ethers";
import { BackwardsCompatibilityProviderAdapter } from "hardhat/internal/core/providers/backwards-compatibility";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  RequestArguments,
  HardhatRuntimeEnvironment,
  Artifacts,
  EIP1193Provider,
} from "hardhat/types";
import { printLogs } from "./logs";
import { TracerEnv, TracerDependencies, ProviderLike } from "./types";

/**
 * Wrapped provider which extends requests
 */
class TracerWrapper extends ProviderWrapper {
  dependencies: TracerDependencies;
  txPrinted: { [key: string]: boolean } = {};

  constructor(dependencies: TracerDependencies) {
    super((dependencies.provider as unknown) as EIP1193Provider);
    this.dependencies = dependencies;
  }

  public async request(args: RequestArguments): Promise<unknown> {
    // let result = (await (this.provider.request
    //   ? this._wrappedProvider.request(args)
    //   : // @ts-ignore
    //     this._wrappedProvider.send(args.method, args.params as any[]))) as any;

    let result = await this.dependencies.provider.send(
      args.method,
      args.params as any[]
    );

    if (
      result != null &&
      (args.method === "eth_sendTransaction" ||
        args.method === "eth_sendRawTransaction" ||
        args.method === "eth_getTransactionReceipt")
    ) {
      let hash = result;
      let receipt;
      if (typeof result === "object" && result !== null) {
        hash = result.transactionHash ?? result.hash;
        receipt = result;
      } else {
        receipt = await this.dependencies.provider.send(
          "eth_getTransactionReceipt",
          [hash]
        );
      }
      if (!this.txPrinted[hash] && receipt !== null) {
        // console.log(hash);
        this.txPrinted[hash] = true;
        const dependenciesExtended = {
          ...this.dependencies,
          nameTags: { ...this.dependencies.tracerEnv.nameTags },
        };
        // @ts-ignore
        await printLogs(hash, receipt, dependenciesExtended);
      }
    }
    return result;
  }
}

/**
 * Add hardhat-tracer to your environment
 * @param hre: HardhatRuntimeEnvironment - required to get access to contract artifacts and tracer env
 */
export function wrapHardhatProvider(hre: HardhatRuntimeEnvironment) {
  const tracerProvider = new TracerWrapper({
    artifacts: hre.artifacts,
    tracerEnv: (hre as any).tracer,
    provider: hre.network.provider,
  });
  const compatibleProvider = new BackwardsCompatibilityProviderAdapter(
    tracerProvider
  );
  hre.network.provider = compatibleProvider;

  if (!(hre as any).tracer) {
    (hre as any).tracer = {
      nameTags: {},
      _internal: { printNameTagTip: undefined },
    };
  }
}

/**
 * Wrap hardhat-tracer over an ethers provider
 * @param provider an ethers provider to attach hardhat-tracer logic
 * @param artifacts hre.artifacts
 * @param tracerEnv hre.tracer
 * @returns
 */
export function wrapEthersProvider(
  provider: ProviderLike,
  artifacts: Artifacts,
  tracerEnv?: TracerEnv
): ethers.providers.Provider {
  if (!tracerEnv) {
    tracerEnv = {
      nameTags: {},
      _internal: { printNameTagTip: undefined },
    };
  }

  const tracerProvider = new TracerWrapper({ provider, artifacts, tracerEnv });
  const compatibleProvider = new BackwardsCompatibilityProviderAdapter(
    tracerProvider
  );

  return new ethers.providers.Web3Provider(compatibleProvider as any);
}
