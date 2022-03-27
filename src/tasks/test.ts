import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import { task } from "hardhat/config";

import { addCommonTracerFlagsTo, applyCommonFlagsToTracerEnv } from "../utils";
import { wrapHardhatProvider } from "../wrapper";

addCommonTracerFlagsTo(task(TASK_TEST, "Runs mocha tests")).setAction(
  async (args, hre, runSuper) => {
    applyCommonFlagsToTracerEnv(args, hre);

    wrapHardhatProvider(hre);

    return runSuper(args);
  }
);
