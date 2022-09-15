import { ethers } from "ethers";
import { BackwardsCompatibilityProviderAdapter } from "hardhat/internal/core/providers/backwards-compatibility";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  Artifacts,
  EIP1193Provider,
  HardhatRuntimeEnvironment,
  RequestArguments,
} from "hardhat/types";

import { printDebugTraceOrLogs } from "./print";
import {
  ProviderLike,
  TracerDependencies,
  TracerEnv,
  TracerEnvUser,
} from "./types";
import { getTracerEnvFromUserInput, isOnlyLogs } from "./utils";

/**
 * Wrapped provider which extends requests
 */
class TracerWrapper extends ProviderWrapper {
  public dependencies: TracerDependencies;
  public txPrinted: { [key: string]: boolean } = {};

  constructor(dependencies: TracerDependencies) {
    super((dependencies.provider as unknown) as EIP1193Provider);
    this.dependencies = dependencies;
  }

  public async request(args: RequestArguments): Promise<unknown> {
    let result;
    let error: any;
    console.log(args.method);

    try {
      result = await this.dependencies.provider.send(
        args.method,
        args.params as any[]
      );
    } catch (_error) {
      error = _error;
    }

    // TODO take decision whether to print or not
    // if estimateGas fails then print it
    // sendTx should be printing it regardless of success or failure
    const isEstimateGasFailed = args.method === "eth_estimateGas" && !!error;
    const isSendTransaction = args.method === "eth_sendTransaction";
    const isEthCall = args.method === "eth_call";

    if (isEstimateGasFailed || isSendTransaction || isEthCall) {
      this.dependencies.tracerEnv.recorder?.previousTraces?.[
        this.dependencies.tracerEnv.recorder?.previousTraces.length - 1
      ]?.print?.();
    }

    if (error) {
      throw error;
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
    tracerEnv: hre.tracer,
    provider: hre.network.provider,
  });
  const compatibleProvider = new BackwardsCompatibilityProviderAdapter(
    tracerProvider
  );
  hre.network.provider = compatibleProvider;

  // ensure env is present
  hre.tracer = hre.tracer ?? getTracerEnvFromUserInput(hre.tracer);
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
  // ensure env is present
  tracerEnv = getTracerEnvFromUserInput(tracerEnv);

  const tracerProvider = new TracerWrapper({ provider, artifacts, tracerEnv });
  const compatibleProvider = new BackwardsCompatibilityProviderAdapter(
    tracerProvider
  );

  return new ethers.providers.Web3Provider(compatibleProvider as any);
}
