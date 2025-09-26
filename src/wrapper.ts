import { BackwardsCompatibilityProviderAdapter } from "hardhat/internal/core/providers/backwards-compatibility";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  EIP1193Provider,
  EthereumProvider,
  HardhatRuntimeEnvironment,
  RequestArguments,
} from "hardhat/types";
import createDebug from "debug";

import { print } from "./print";
import { ProviderLike, TracerDependencies } from "./types";
import { getTxHash } from "./utils/tx-hash";

const debug = createDebug("hardhat-tracer:wrapper");

/**
 * Wrapped provider which extends requests
 */
class TracerWrapper extends ProviderWrapper {
  public dependencies: TracerDependencies;
  public txPrinted: { [key: string]: boolean } = {};
  concurrentCalls = 0;

  constructor(dependencies: TracerDependencies) {
    super((dependencies.provider as unknown) as EIP1193Provider);
    this.dependencies = dependencies;
  }

  public async request(args: RequestArguments): Promise<unknown> {
    const tracerEnv = this.dependencies.tracerEnv;

    debug(`wrapped request ${args.method}`);
    let result;
    let error: any;
    // console.log("wrapper->args.method", args.method);

    // print trace for verbosity 3 and 4
    const traceWhitelist = [
      "eth_sendTransaction",
      "eth_sendRawTransaction",
      "eth_call",
      "eth_estimateGas",
      "debug_traceTransaction",
      "evm_mine",
    ];

    // print trace for verbosity 1 and 2
    const traceErrorWhitelist = [
      "eth_sendTransaction",
      "eth_sendRawTransaction",
      "eth_call",
      "eth_estimateGas",
    ];

    const shouldTrace =
      tracerEnv.enabled &&
      traceWhitelist.includes(args.method) &&
      (!!tracerEnv.printNext || tracerEnv.verbosity > 0);

    if (shouldTrace) {
      this.concurrentCalls += 1;
      if (this.concurrentCalls == 1) {
        await tracerEnv.switch!.enable();
      }
      debug("Tracing switch enabled");
    }

    try {
      result = await this.dependencies.provider.send(
        args.method,
        args.params as any[]
      );
    } catch (_error) {
      error = _error;
    }

    if (shouldTrace) {
      if (this.concurrentCalls == 1) {
        await tracerEnv.switch!.disable();
      }
      debug("Tracing switch disabled");
      this.concurrentCalls -= 1;
    }

    // infer tx hash and store in the trace
    const lastTrace = tracerEnv.lastTrace();
    const txHash = getTxHash(args, result);
    if (lastTrace && txHash) {
      tracerEnv.recorder?.storeLastTrace(txHash);
      lastTrace.hash = txHash;
    }

    let shouldPrint: boolean;
    switch (tracerEnv.verbosity) {
      case 0:
        shouldPrint = !!tracerEnv.printNext;
        break;
      case 1:
      case 2:
        shouldPrint =
          (!!error && traceErrorWhitelist.includes(args.method)) ||
          (!!tracerEnv.printNext && traceWhitelist.includes(args.method));
        break;
      case 3:
      case 4:
        shouldPrint = traceWhitelist.includes(args.method);
        break;
      default:
        throw new Error(
          "[hardhat-tracer]: Invalid verbosity value: " + tracerEnv.verbosity
        );
    }
    debug(
      `shouldPrint=${shouldPrint}, tracer.enabled: ${tracerEnv.enabled}, tracer.ignoreNext=${tracerEnv.ignoreNext}, tracer.printNext=${tracerEnv.printNext}`
    );

    if (tracerEnv.enabled && shouldPrint) {
      if (tracerEnv.ignoreNext) {
        tracerEnv.ignoreNext = false;
      } else {
        if (lastTrace) {
          // TODO first check if this trace is what we want to print, i.e. tally the transaction hash.
          tracerEnv.printNext = false;

          // print all the pending traces
          const pendingTraces = tracerEnv.recorder!.previousTraces.slice(
            tracerEnv.recorder!.printIndex + 1
          );
          for (const trace of pendingTraces) {
            await print(trace, this.dependencies);
          }
        } else {
          console.warn(
            `Hardhat Tracer wanted to print trace, but lastTrace is undefined. 
This only works on hardhat network, if you are running your script over RPC provider then VM data is not available.
If you think this is a bug please create issue at https://github.com/zemse/hardhat-tracer`
          );
        }
      }
    }

    // advancing the printIndex
    if (tracerEnv.recorder) {
      tracerEnv.recorder.printIndex =
        tracerEnv.recorder.previousTraces.length - 1;
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
export function wrapTracer(
  hre: HardhatRuntimeEnvironment,
  provider: ProviderLike
): EthereumProvider {
  // do not wrap if already wrapped
  if (isTracerAlreadyWrappedInHreProvider(hre)) {
    debug("hre provider is already wrapped with TracerWrapper");
    return hre.network.provider;
  }
  debug("Wrapping hre provider with TracerWrapper");
  return wrapProvider(
    hre,
    new TracerWrapper({
      artifacts: hre.artifacts,
      tracerEnv: hre.tracer,
      provider: provider ?? hre.network.provider,
    })
  );
}

export function wrapProvider(
  hre: HardhatRuntimeEnvironment,
  wrapper: ProviderWrapper
): EthereumProvider {
  // get existing listeners and remove them from the provider
  let eventListeners: { [key: string | symbol]: Array<Function> } = {};
  for (const eventName of hre.network.provider.eventNames()) {
    eventListeners[eventName] = [];
    for (const listener of hre.network.provider.listeners(eventName)) {
      eventListeners[eventName].push(listener);
    }
    hre.network.provider.removeAllListeners(eventName);
  }

  const compatibleProvider = new BackwardsCompatibilityProviderAdapter(wrapper);
  hre.network.provider = compatibleProvider;

  // re-register the listeners
  for (const [eventName, listeners] of Object.entries(eventListeners)) {
    for (const listener of listeners) {
      hre.network.provider.on(eventName, listener as any);
    }
  }

  return hre.network.provider;
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
