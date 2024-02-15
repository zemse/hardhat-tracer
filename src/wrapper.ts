import { BackwardsCompatibilityProviderAdapter } from "hardhat/internal/core/providers/backwards-compatibility";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  EIP1193Provider,
  HardhatRuntimeEnvironment,
  RequestArguments,
} from "hardhat/types";

import { print } from "./print";
import { TracerDependencies } from "./types";

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
    // console.log("wrapper->args.method", args.method);

    try {
      result = await this.dependencies.provider.send(
        args.method,
        args.params as any[]
      );
    } catch (_error) {
      error = _error;
    }

    // take decision whether to print last trace or not
    const isSendTransaction = args.method === "eth_sendTransaction";
    const isSendRawTransaction = args.method === "eth_sendRawTransaction";
    const isEthCall = args.method === "eth_call";
    const isEstimateGas = args.method === "eth_estimateGas";

    const isSendTransactionFailed = isSendTransaction && !!error;
    const isSendRawTransactionFailed = isSendRawTransaction && !!error;
    const isEthCallFailed = isEthCall && !!error;
    const isEstimateGasFailed = isEstimateGas && !!error;

    let shouldPrint: boolean;

    switch (this.dependencies.tracerEnv.verbosity) {
      case 0:
        shouldPrint = false;
        break;
      case 1:
      case 2:
        shouldPrint =
          isSendTransactionFailed ||
          isSendRawTransactionFailed ||
          isEthCallFailed ||
          isEstimateGasFailed ||
          (!!this.dependencies.tracerEnv.printNext &&
            (isSendTransaction ||
              isSendRawTransaction ||
              isEthCall ||
              isEstimateGasFailed));
        break;
      case 3:
      case 4:
        shouldPrint =
          isSendTransaction ||
          isSendRawTransaction ||
          isEthCall ||
          isEstimateGasFailed;
        break;
      default:
        throw new Error(
          "[hardhat-tracer]: Invalid verbosity value: " +
            this.dependencies.tracerEnv.verbosity
        );
    }

    if (this.dependencies.tracerEnv.enabled && shouldPrint) {
      if (this.dependencies.tracerEnv.ignoreNext) {
        this.dependencies.tracerEnv.ignoreNext = false;
      } else {
        const lastTrace = this.dependencies.tracerEnv.lastTrace();
        if (lastTrace) {
          this.dependencies.tracerEnv.printNext = false;
          await print(lastTrace, this.dependencies);
        }
      }
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
  wrapProvider(
    hre,
    new TracerWrapper({
      artifacts: hre.artifacts,
      tracerEnv: hre.tracer,
      provider: hre.network.provider,
    })
  );
}

export function wrapProvider(
  hre: HardhatRuntimeEnvironment,
  wrapper: ProviderWrapper
) {
  // do not wrap if already wrapped
  if (isTracerAlreadyWrappedInHreProvider(hre)) {
    return;
  }

  const compatibleProvider = new BackwardsCompatibilityProviderAdapter(wrapper);
  hre.network.provider = compatibleProvider;
}

export function isTracerAlreadyWrappedInHreProvider(
  hre: HardhatRuntimeEnvironment
) {
  const maxLoopIterations = 1024;
  let currentLoopIterations = 0;

  let provider: any = hre.network.provider;
  while (provider !== undefined) {
    if (provider instanceof TracerWrapper) {
      return true;
    }

    // move down the chain
    try {
      provider = provider._wrapped;
    } catch {
      // throws error when we reach the og provider
      // HardhatError: HH21: You tried to access an uninitialized provider. To
      // initialize the provider, make sure you first call `.init()` or any
      // method that hits a node like request, send or sendAsync.
      return false;
    }

    // Just throw if we ever end up in (what seems to be) an infinite loop.
    currentLoopIterations += 1;
    if (currentLoopIterations > maxLoopIterations) {
      return false;
    }
  }

  return false;
}
