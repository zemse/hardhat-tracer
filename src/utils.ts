import { ethers } from "ethers";
import { NameTags } from "./type-extensions";

export function getFromNameTags(
  address: string,
  nameTags: NameTags
) {
  return (
    nameTags[address] ||
    nameTags[address.toLowerCase()] ||
    nameTags[address.toUpperCase()] ||
    nameTags[ethers.utils.getAddress(address)]
  );
}

export function setInNameTags(
  address: string,
  value: string,
  nameTags: NameTags
) {
  replaceIfExists(address, value, nameTags) ||
    replaceIfExists(address.toLowerCase(), value, nameTags) ||
    replaceIfExists(address.toUpperCase(), value, nameTags) ||
    replaceIfExists(ethers.utils.getAddress(address), value, nameTags) ||
    (nameTags[ethers.utils.getAddress(address)] = value);

  
}

function replaceIfExists(key: string, value: string, nameTags: NameTags) {
  if (
    nameTags[key] &&
    !nameTags[key].split(" / ").includes(value)
  ) {
    nameTags[key] = `${value} / ${nameTags[key]}`;
    return true;
  } else {
    return false;
  }
}