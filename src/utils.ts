import { ethers } from "ethers";

export function getFromAddressLabel(
  addressLabels: { [key: string]: string },
  address: string
) {
  return (
    addressLabels[address] ||
    addressLabels[address.toLowerCase()] ||
    addressLabels[address.toUpperCase()] ||
    addressLabels[ethers.utils.getAddress(address)]
  );
}

export function setInAddressLabel(
  addressLabels: { [key: string]: string },
  address: string,
  value: string
) {
  replaceIfExists(address, value) ||
    replaceIfExists(address.toLowerCase(), value) ||
    replaceIfExists(address.toUpperCase(), value) ||
    replaceIfExists(ethers.utils.getAddress(address), value) ||
    (addressLabels[ethers.utils.getAddress(address)] = value);

  function replaceIfExists(key: string, value: string) {
    if (addressLabels[key]) {
      addressLabels[key] = `${value} / ${addressLabels[key]}`;
      return true;
    } else {
      return false;
    }
  }
}
