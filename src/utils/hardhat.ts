import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MinimalEthereumJsVm } from "hardhat/internal/hardhat-network/provider/vm/minimal-vm";
import { EdrProviderWrapper } from "hardhat/internal/hardhat-network/provider/provider";
import { MinimalExecResult } from "hardhat/internal/hardhat-network/provider/vm/types";

export async function getVMFromBaseProvider(
  provider: EdrProviderWrapper
): Promise<MinimalEthereumJsVm> {
  return (provider as any)._node._vm;
}

/**
 * Finds the "base" Ethereum provider of the current hardhat environment.
 *
 * Basically, hardhat uses a system of nested providers where each provider wraps the next and
 * "provides" some extra features. When you're running on top of the "hardhat evm" the bottom of
 * this series of providers is the "HardhatNetworkProvider":
 * https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/src/internal/hardhat-network/provider/provider.ts
 * This object has direct access to the node (provider._node), which in turn has direct access to
 * the vm instance (provider._node._vm). So it's quite useful to be able to find this
 * object reliably!
 *
 * Credits: this code adapted from smock.
 *
 * @param hre hardhat runtime environment to pull the base provider from.
 * @return base hardhat network provider
 */
export const getHardhatBaseProvider = async (
  runtime: HardhatRuntimeEnvironment
): Promise<EdrProviderWrapper> => {
  // This function is pretty approximate. Haven't spent enough time figuring out if there's a more
  // reliable way to get the base provider. I can imagine a future in which there's some circular
  // references and this function ends up looping. So I'll just preempt this by capping the maximum
  // search depth.
  const maxLoopIterations = 1024;
  let currentLoopIterations = 0;

  // Search by looking for the internal "_wrapped" variable. Base provider doesn't have this
  // property (at least for now!).
  let provider: any = runtime.network.provider;

  // This is a no-op if the provider is already initialized.
  if (provider.init) await provider.init();

  while (provider._wrapped !== undefined) {
    provider = provider._wrapped;

    // Just throw if we ever end up in (what seems to be) an infinite loop.
    currentLoopIterations += 1;
    if (currentLoopIterations > maxLoopIterations) {
      throw new Error(
        `unable to find base hardhat provider. are you sure you're running locally?`
      );
    }
  }

  // TODO: Figure out a reliable way to do a type check here. Source for inspiration:
  // https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/src/internal/hardhat-network/provider/provider.ts
  return provider;
};

/**
 * Parses the result of an execution to be usable easily.
 * @param execResult
 * @returns Parsed exec result
 */
export function parseExec(execResult: MinimalExecResult) {
  const success = execResult.success;
  const reason = execResult.reason;

  const isStop = success && reason === 0;
  const isReturn = success && reason === 1;
  const isSelfDestruct = success && reason === 2;

  const isRevert = !success && reason === undefined;

  const isException = !success && reason !== undefined;
  const isOutOfGas = !success && reason === 0;
  const isOpcodeNotFound = !success && reason === 1;
  const isInvalidFEOpcode = !success && reason === 2;
  const isInvalidJump = !success && reason === 3;
  const isNotActivated = !success && reason === 4;
  const isStackUnderflow = !success && reason === 5;
  const isStackOverflow = !success && reason === 6;
  const isOutOfOffset = !success && reason === 7;
  const isCreateCollision = !success && reason === 8;
  const isPrecompileError = !success && reason === 9;
  const isNonceOverflow = !success && reason === 10;
  const isCreateContractSizeLimit = !success && reason === 11;
  const isCreateContractStartingWithEF = !success && reason === 12;
  const isCreateInitCodeSizeLimit = !success && reason === 13;

  let successStr = "";
  if (success) {
    switch (reason) {
      case 0:
        successStr = "STOP";
        break;
      case 1:
        successStr = "RETURN";
        break;
      case 2:
        successStr = "SELFDESTRUCT";
        break;
      default:
        successStr = "UNKNOWN";
        break;
    }
  }

  let errorStr = "";
  if (!success) {
    switch (reason) {
      case 0:
        errorStr = "OUT_OF_GAS";
        break;
      case 1:
        errorStr = "OPCODE_NOT_FOUND";
        break;
      case 2:
        errorStr = "INVALID_FE_OPCODE";
        break;
      case 3:
        errorStr = "INVALID_JUMP";
        break;
      case 4:
        errorStr = "NOT_ACTIVATED";
        break;
      case 5:
        errorStr = "STACK_UNDERFLOW";
        break;
      case 6:
        errorStr = "STACK_OVERFLOW";
        break;
      case 7:
        errorStr = "OUT_OF_OFFSET";
        break;
      case 8:
        errorStr = "CREATE_COLLISION";
        break;
      case 9:
        errorStr = "PRECOMPILE_ERROR";
        break;
      case 10:
        errorStr = "NONCE_OVERFLOW";
        break;
      case 11:
        errorStr = "CREATE_CONTRACT_SIZE_LIMIT";
        break;
      case 12:
        errorStr = "CREATE_CONTRACT_STARTING_WITH_EF";
        break;
      case 13:
        errorStr = "CREATE_INIT_CODE_SIZE_LIMIT";
        break;
      default:
        errorStr = "UNKNOWN";
        break;
    }
  }

  let reasonStr = success ? successStr : errorStr;

  return {
    reason,
    success,
    isStop,
    isReturn,
    isSelfDestruct,
    isRevert,
    isException,
    isOutOfGas,
    isOpcodeNotFound,
    isInvalidFEOpcode,
    isInvalidJump,
    isNotActivated,
    isStackUnderflow,
    isStackOverflow,
    isOutOfOffset,
    isCreateCollision,
    isPrecompileError,
    isNonceOverflow,
    isCreateContractSizeLimit,
    isCreateContractStartingWithEF,
    isCreateInitCodeSizeLimit,
    successStr,
    errorStr,
    reasonStr,
  };
}
