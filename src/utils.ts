import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export function getFromNameTags(
  address: string,
  hre: HardhatRuntimeEnvironment
) {
  return (
    hre.tracer.nameTags[address] ||
    hre.tracer.nameTags[address.toLowerCase()] ||
    hre.tracer.nameTags[address.toUpperCase()] ||
    hre.tracer.nameTags[ethers.utils.getAddress(address)]
  );
}

export function setInNameTags(
  address: string,
  value: string,
  hre: HardhatRuntimeEnvironment
) {
  replaceIfExists(address, value) ||
    replaceIfExists(address.toLowerCase(), value) ||
    replaceIfExists(address.toUpperCase(), value) ||
    replaceIfExists(ethers.utils.getAddress(address), value) ||
    (hre.tracer.nameTags[ethers.utils.getAddress(address)] = value);

  function replaceIfExists(key: string, value: string) {
    if (
      hre.tracer.nameTags[key] &&
      !hre.tracer.nameTags[key].split(" / ").includes(value)
    ) {
      hre.tracer.nameTags[key] = `${value} / ${hre.tracer.nameTags[key]}`;
      return true;
    } else {
      return false;
    }
  }
}
