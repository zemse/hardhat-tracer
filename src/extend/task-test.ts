import { task } from "hardhat/config";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";

import { wrapHardhatProvider } from "../wrapper";

task(TASK_TEST, "Runs mocha tests")
  .addFlag("logs", "print logs emmitted during transactions")
  .addFlag("trace", "trace logs and calls in transactions")
  .addFlag("fulltrace", "trace logs, calls and storage writes in transactions")
  .setAction(async (args, hre, runSuper) => {
    if (args.trace || args.logs) {
      hre.tracer.enabled = true;

      if (args.logs) {
        hre.tracer.logs = true;
      }

      if (args.trace) {
        hre.tracer.logs = true;
        hre.tracer.calls = true;
      }

      if (args.full_trace) {
        hre.tracer.logs = true;
        hre.tracer.calls = true;
        hre.tracer.sloads = true;
        hre.tracer.sstores = true;
      }

      wrapHardhatProvider(hre);
    }
    return runSuper(args);
  });
