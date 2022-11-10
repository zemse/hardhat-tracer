import { TASK_NODE } from "hardhat/builtin-tasks/task-names";
import { task } from "hardhat/config";

import { addCliParams, applyCliArgsToTracer } from "../utils";
import { wrapHardhatProvider } from "../wrapper";

addCliParams(task(TASK_NODE, "Run hardhat node")).setAction(
  async (args, hre, runSuper) => {
    applyCliArgsToTracer(args, hre);

    wrapHardhatProvider(hre);

    return runSuper(args);
  }
);
