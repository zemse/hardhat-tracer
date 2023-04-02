// tslint:disable:no-implicit-dependencies
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, get },
    getNamedAccounts,
  } = hre;

  const { deployer } = await getNamedAccounts();

  const Lib = await get("Lib");

  await deploy("Hello", {
    from: deployer,
    log: true,
    libraries: {
      Lib: Lib.address,
    },
  });
};

export default func;
func.tags = ["Hello"];
func.dependencies = ["Lib"];
