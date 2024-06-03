// We load the plugin here.
// tslint:disable:no-implicit-dependencies
import "@nomiclabs/hardhat-ethers";
import dotenv from "dotenv";
import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/types";

import "../../../src/index";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  defaultNetwork: "hardhat",

  networks: {
    hardhat: {
      chainId: 1,
      saveDeployments: false,
    },
    localhost: {
      url: "http://localhost:8545",
      saveDeployments: false,
    },
    mainnet: {
      chainId: 1,
      url: "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY,
    },
    arbitrum: {
      url: "https://arb-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY,
    },
  },
  paths: {},
  tracer: {
    enabled: true,
    // enableAllOpcodes: true,
    showAddresses: true,
    gasCost: true,
    // use4bytesDirectory: false,
    stateOverrides: {
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
        storage: {
          "0x1abf42a573070203916aa7bf9118741d8da5f9522f66b5368aa0a2644f487b38": 0,
        },
      },
      "0x0000000000000000000000000000001234567890": {
        bytecode: "Hello",
        // {
        //   name: "Hello",
        //   libraries: {
        //     Lib: "Lib", // TODO try to take library automatically
        //   },
        // },
      },
      "0xC611D00000000000000000000000000000000000": {
        bytecode: "Child",
      },
    },
    tasks: ["deploy"],
  },
  namedAccounts: {
    deployer: 0,
  },
};

export default config;
