// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";

import "../../../src/index";

import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  paths: {},
  tracer: {
    enabled: true,
  },
};

export default config;
