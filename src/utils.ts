import { ethers } from "ethers";
import { TracerDependenciesExtended } from "./types";

export function getFromNameTags(
  address: string,
  dependencies: TracerDependenciesExtended
) {
  return (
    dependencies.nameTags[address] ||
    dependencies.nameTags[address.toLowerCase()] ||
    dependencies.nameTags[address.toUpperCase()] ||
    dependencies.nameTags[ethers.utils.getAddress(address)]
  );
}

export function setInNameTags(
  address: string,
  value: string,
  dependencies: TracerDependenciesExtended
) {
  replaceIfExists(address, value, dependencies) ||
    replaceIfExists(address.toLowerCase(), value, dependencies) ||
    replaceIfExists(address.toUpperCase(), value, dependencies) ||
    replaceIfExists(ethers.utils.getAddress(address), value, dependencies) ||
    (dependencies.nameTags[ethers.utils.getAddress(address)] = value);
}

function replaceIfExists(
  key: string,
  value: string,
  dependencies: TracerDependenciesExtended
) {
  if (
    dependencies.nameTags[key] &&
    !dependencies.nameTags[key].split(" / ").includes(value)
  ) {
    dependencies.nameTags[key] = `${value} / ${dependencies.nameTags[key]}`;
    return true;
  } else {
    return false;
  }
}
