try {
  // Try to check if hardhat version is compatible by checking if the package is available
  require("@nomicfoundation/ethereumjs-vm");
} catch {
  console.error(
    `

ERROR

This version of "hardhat-tracer" only works with versions of
Hardhat previous to 2.21.0.

Please update "hardhat" and "hardhat-tracer" to latest version.

npm install hardhat@latest hardhat-tracer@latest
`
  );
  process.exit(1);
}

import "./chai";
import "./extend";
import "./tasks";
export * from "./types";
export * from "./wrapper";
