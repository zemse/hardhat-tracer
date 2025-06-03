import { Address } from "@ethereumjs/util";
import { MinimalEthereumJsVm } from "hardhat/internal/hardhat-network/provider/vm/minimal-vm";
import { BigNumber, ethers } from "ethers";
import { hexZeroPad } from "ethers/lib/utils";
import { Artifacts } from "hardhat/types";

import { ContractInfo, StateOverrides } from "../types";

async function setBytecode(
  contractInfo: ContractInfo,
  artifacts: Artifacts,
  addressThis: string,
  vm: MinimalEthereumJsVm
) {
  if (typeof contractInfo === "string") {
    if (ethers.utils.isHexString(contractInfo)) {
      // directly bytecode was given
      return contractInfo;
    } else {
      // name was given
      contractInfo = {
        name: contractInfo,
      };
    }
  }

  // its possible artifacts are not compiled here
  const artifact = artifacts.readArtifactSync(contractInfo.name);
  let bytecode = artifact.deployedBytecode;

  if (bytecode.startsWith("0x730000000000000000000000000000000000000000")) {
    // this is a library, so we need to replace the placeholder address
    bytecode = "0x73" + addressThis.slice(2) + bytecode.slice(44);
  }

  if (artifact.deployedLinkReferences) {
    const paths = Object.keys(artifact.deployedLinkReferences);
    for (const path of paths) {
      const libraryNames = Object.keys(artifact.deployedLinkReferences[path]);
      for (const libraryName of libraryNames) {
        const fullName = path + ":" + libraryName;

        let libraryInfo =
          contractInfo.libraries?.[libraryName] ??
          contractInfo.libraries?.[fullName];

        if (!libraryInfo) {
          // add guess for library, if it's available in the same repo
          libraryInfo = {
            name: fullName,
          };
          // throw new Error(
          //   `[hardhat-tracer]: Library ${libraryName} not found in libraries object for ${contractInfo.name}`
          // );
        }

        let addressToLink;

        if (
          typeof libraryInfo === "string" &&
          ethers.utils.isHexString(libraryInfo) &&
          libraryInfo.length === 42
        ) {
          // address was given for library
          addressToLink = libraryInfo;
        } else {
          // since we don't have an address for library, lets generate a random one
          addressToLink = ethers.utils.id(fullName).slice(0, 42);
          await setBytecode(libraryInfo, artifacts, addressToLink, vm);
        }

        // we have the address of library now, so let's link it
        bytecode = bytecode.replace(
          new RegExp(
            `__\\$${ethers.utils.id(fullName).slice(2, 36)}\\$__`,
            "g"
          ),
          addressToLink.replace(/^0x/, "").toLowerCase()
        );
      }
    }
  }

  if (!ethers.utils.isHexString(bytecode)) {
    throw new Error(
      `[hardhat-tracer]: Invalid bytecode specified in stateOverrides for ${contractInfo.name}: ${bytecode}`
    );
  }

  // set the bytecode
  await vm.stateManager.putContractCode(
    Address.fromString(addressThis),
    Buffer.from(bytecode.slice(2), "hex")
  );
}

export async function applyStateOverrides(
  stateOverrides: StateOverrides,
  vm: MinimalEthereumJsVm,
  artifacts: Artifacts
) {
  for (const [_address, overrides] of Object.entries(stateOverrides)) {
    if (!ethers.utils.isAddress(_address)) {
      throw new Error(
        `[hardhat-tracer]: Invalid address ${_address} in stateOverrides`
      );
    }

    const address = Address.fromString(_address);
    // TODO for balance and nonce
    // if (overrides.balance !== undefined || overrides.nonce !== undefined) {
    //   const account = await vm.stateManager.getAccount(address);
    //   if (account === undefined) {
    //     throw new Error("account is undefined");
    //   }

    //   if (overrides.nonce !== undefined) {
    //     account.nonce = BigNumber.from(overrides.nonce).toBigInt();
    //   }
    //   if (overrides.balance) {
    //     account.balance = BigNumber.from(overrides.balance).toBigInt();
    //   }
    //   await vm.stateManager.putAccount(address, account);
    // }

    // for bytecode
    if (overrides.bytecode) {
      await setBytecode(overrides.bytecode, artifacts, _address, vm);
    }

    // for storage slots
    if (overrides.storage) {
      for (const [key, value] of Object.entries(overrides.storage)) {
        await vm.stateManager.putContractStorage(
          address,
          Buffer.from(
            hexZeroPad(BigNumber.from(key).toHexString(), 32).slice(2),
            "hex"
          ),
          Buffer.from(
            hexZeroPad(BigNumber.from(value).toHexString(), 32).slice(2),
            "hex"
          )
        );
      }
    }
  }
}
