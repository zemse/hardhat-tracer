// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";

import "../../../src/index";

import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",

  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    mainnet: {
      chainId: 1,
      url: "https://eth-mainnet.alchemyapi.io/v2/AS_LAx2_WJh1iEAqxd1-AHQ-yb71CiCHF".replace(
        "_",
        ""
      ),
    },
  },
  paths: {},
  tracer: {
    // enabled: true,
  },
};

export default config;
