import { TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS } from "hardhat/builtin-tasks/task-names";
import { task } from "hardhat/config";

task(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS).setAction(
  async (args, hre, runSuper) => {
    const result = await runSuper(args);

    // if artifacts are updated after compilation step, then update the decoder
    if (hre.tracer.decoder) {
      hre.tracer.decoder.updateArtifacts(hre.artifacts);
    }

    return result;
  }
);
