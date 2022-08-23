// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-ethers";

import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  paths: {},
  tracer: {
    enabled: true,
  },
};

export default config;
