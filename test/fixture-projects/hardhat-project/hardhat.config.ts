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
    stateOverrides: {
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
        storage: {
          "0x1abf42a573070203916aa7bf9118741d8da5f9522f66b5368aa0a2644f487b38": 0,
        },
      },
    },
  },
};

export default config;
