import { task } from "hardhat/config";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import { wrapHardhatProvider } from "./wrapper";
import "./type-extensions";

task(TASK_TEST, "Runs mocha tests")
  .addFlag("trace", "trace logs and calls in transactions")
  .addFlag("logs", "print logs emmitted during transactions")
  .setAction(async (args, hre, runSuper) => {
    if (!hre.tracer) {
      hre.tracer = {
        nameTags: {},
        _internal: { printNameTagTip: undefined },
      };
    }

    if (args.trace || args.logs) {
      wrapHardhatProvider(hre);
    }
    return runSuper(args);
  });
