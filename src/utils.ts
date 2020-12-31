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
  if (addressLabels[address]) {
    addressLabels[address] = value;
  } else if (addressLabels[address.toLowerCase()]) {
    addressLabels[address.toLowerCase()] = value;
  } else if (addressLabels[address.toUpperCase()]) {
    addressLabels[address.toUpperCase()] = value;
  } else {
    addressLabels[ethers.utils.getAddress(address)] = value;
  }
}
