import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import { task } from "hardhat/config";
import { wrapHardhatProvider } from "../wrapper";

task(TASK_TEST, "Runs mocha tests")
  // 3 modes of operation:
  .addFlag("logs", "print logs emmitted during transactions")
  .addFlag("trace", "trace logs and calls in transactions")
  .addFlag("fulltrace", "trace logs, calls and storage writes in transactions")
  .addFlag("fullTrace", "trace logs, calls and storage writes in transactions")
  // additional flag to print gas usage
  .addFlag("gas", "include")
  .addFlag("gascost", "include")
  .addFlag("gasCost", "include")
  .setAction(async (args, hre, runSuper) => {
    if (args.trace || args.logs) {
      hre.tracer.enabled = true;

      if (args.logs) {
        hre.tracer.logs = true;
        hre.tracer.calls = false;
        hre.tracer.sloads = false;
        hre.tracer.sstores = false;
      }

      if (args.trace) {
        hre.tracer.logs = true;
        hre.tracer.calls = true;
        hre.tracer.sloads = false;
        hre.tracer.sstores = false;
      }

      if (args.fulltrace || args.fullTrace) {
        hre.tracer.logs = true;
        hre.tracer.calls = true;
        hre.tracer.sloads = true;
        hre.tracer.sstores = true;
        hre.tracer.gasCost = true;
      }

      if (args.gas || args.gascost || args.gasCost) {
        hre.tracer.gasCost = true;
      }

      wrapHardhatProvider(hre);
    }
    return runSuper(args);
  });
