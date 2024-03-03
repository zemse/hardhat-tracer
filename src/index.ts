try {
  // Try to check if hardhat version is compatible by checking if the package is available
  require("@nomicfoundation/ethereumjs-vm");
} catch {
  console.error(
    `

ERROR

This version of "hardhat-tracer" only works with versions of
Hardhat previous to 2.21.0.

A new version compatible with the latest Hardhat will be released soon.

In the meantime, downgrade Hardhat to 2.20.1, or remove "hardhat-tracer"
from your Hardhat config.
`
  );
  process.exit(1);
}

import "./chai";
import "./extend";
import "./tasks";
export * from "./types";
export * from "./wrapper";
