import { addCliParams, applyCliArgsToTracer } from "../utils";
import { task } from "hardhat/config";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import { wrapHardhatProvider } from "../wrapper";

addCliParams(task(TASK_TEST, "Runs mocha tests")).setAction(
  async (args, hre, runSuper) => {
    applyCliArgsToTracer(args, hre);

    wrapHardhatProvider(hre);

    return runSuper(args);
  }
);
