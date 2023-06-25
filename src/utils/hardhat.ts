import { VM } from "@nomicfoundation/ethereumjs-vm";
import { HardhatNode } from "hardhat/internal/hardhat-network/provider/node";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function getVM(hre: HardhatRuntimeEnvironment): Promise<VM> {
  const node = await getNode(hre);
  return (node as any)._vm;
}

// Credits: https://github.com/defi-wonderland/smock/blob/3c2b80b72fe146634b999df5b9bb9ef5ffc27508/src/utils/hardhat.ts#L20-L51
export async function getNode(
  hre: HardhatRuntimeEnvironment
): Promise<HardhatNode> {
  // This function is pretty approximate. Haven't spent enough time figuring out if there's a more
  // reliable way to get the base provider. I can imagine a future in which there's some circular
  // references and this function ends up looping. So I'll just preempt this by capping the maximum
  // search depth.
  const maxLoopIterations = 1024;
  let currentLoopIterations = 0;

  // Search by looking for the internal "_wrapped" variable. Base provider doesn't have this
  // property (at least for now!).
  let provider: any = hre.network.provider;
  while (true) {
    try {
      // throws error when we reach the og provider
      // HardhatError: HH21: You tried to access an uninitialized provider. To
      // initialize the provider, make sure you first call `.init()` or any
      // method that hits a node like request, send or sendAsync.
      if (provider._wrapped === undefined) {
        break;
      }
    } catch {
      break;
    }

    provider = provider._wrapped;

    // Just throw if we ever end up in (what seems to be) an infinite loop.
    currentLoopIterations += 1;
    if (currentLoopIterations > maxLoopIterations) {
      throw new Error(
        `[hardhat-tracer]: unable to find base hardhat provider. are you sure you're running locally?`
      );
    }
  }

  // Sometimes the VM hasn't been initialized by the time we get here, depending on what the user
  // is doing with hardhat (e.g., sending a transaction before calling this function will
  // initialize the vm).
  // Usually we should wait hardhat to initialize this. But if force initialize can be done by setting
  // env variable HARDHAT_TRACER_FORCE_INITIALIZE_PROVIDER=true
  if (
    !!process.env.HARDHAT_TRACER_FORCE_INITIALIZE_PROVIDER &&
    provider._node === undefined
  ) {
    await provider._init();
  }

  // Wait for the VM to be initialized.
  while (provider._node === undefined) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // TODO: Figure out a reliable way to do a type check here. Source for inspiration:
  // https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/src/internal/hardhat-network/provider/provider.ts
  return provider._node as HardhatNode;
}
