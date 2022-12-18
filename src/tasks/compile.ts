import { applyStateOverrides } from "../utils";
import { task } from "hardhat/config";
import { TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS } from "hardhat/builtin-tasks/task-names";

task(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS).setAction(
  async (args, hre, runSuper) => {
    const result = await runSuper(args);

    // if artifacts are updated after compilation step, then update the decoder
    if (hre.tracer.decoder) {
      hre.tracer.decoder.updateArtifacts(hre.artifacts);
    }

    // if state overrides are provided, then apply them after compilation
    if (hre.tracer.stateOverrides && hre.tracer.recorder?.vm) {
      applyStateOverrides(
        hre.tracer.stateOverrides,
        hre.tracer.recorder?.vm,
        hre.artifacts
      );
    }

    return result;
  }
);
