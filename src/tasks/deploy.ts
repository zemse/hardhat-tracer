import { task } from "hardhat/config";

import { addCliParams, applyCliArgsToTracer } from "../utils";
import { wrapHardhatProvider } from "../wrapper";

const TASK_DEPLOY = 'deploy';

addCliParams(task(TASK_DEPLOY, "Run hardhat deploy")).setAction(
  async (args, hre, runSuper) => {
    applyCliArgsToTracer(args, hre);

    wrapHardhatProvider(hre);

    return runSuper(args);
  }
);
