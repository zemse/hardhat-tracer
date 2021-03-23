import { task } from "hardhat/config";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import { BackwardsCompatibilityProviderAdapter } from "hardhat/internal/core/providers/backwards-compatibility";
import { TracerProvider } from "./tracer-provider";
import "./type-extensions";

task(TASK_TEST, "Runs mocha tests")
  .addFlag("trace", "trace logs and calls in transactions")
  .addFlag("logs", "print logs emmitted during transactions")
  .setAction(async (args, hre, runSuper) => {
    if (!hre.tracer)
      hre.tracer = {
        nameTags: {},
        _internal: { printNameTagTip: undefined },
      };

    if (args.trace || args.logs) {
      const tracerProvider = new TracerProvider(hre.network.provider, hre);
      hre.network.provider = new BackwardsCompatibilityProviderAdapter(
        tracerProvider
      );
    }
    return runSuper(args);
  });
