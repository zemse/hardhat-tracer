import createDebug from "debug";
import { TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS } from "hardhat/builtin-tasks/task-names";
import { task } from "hardhat/config";

import { applyStateOverrides } from "../utils";
const debug = createDebug("hardhat-tracer:tasks:compile");

task(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS).setAction(
  async (args, hre, runSuper) => {
    const result = await runSuper(args);

    debug("running post compile actions");
    // if artifacts are updated after compilation step, then update the decoder
    if (hre.tracer.decoder) {
      debug("updating artifacts...");
      hre.tracer.decoder
        .updateArtifacts(hre.artifacts)
        .then(() => debug("artifacts updated successfully!"))
        .catch((e) => {
          debug("error updating artifacts %s", e.message);
          console.log(
            "[hardhat-tracer]: error while updating decoder artifacts after TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS: " +
              e.message
          );
        });
    }

    // if state overrides are provided, then apply them after compilation
    if (hre.tracer.stateOverrides && hre.tracer.recorder?.vm) {
      debug("applying state overrides...");
      applyStateOverrides(
        hre.tracer.stateOverrides,
        hre.tracer.recorder?.vm,
        hre.artifacts
      )
        .then(() => debug("state overrides applied successfully!"))
        .catch((e) => {
          debug("error applying state overrides %s", e.message);
          console.log(
            "[hardhat-tracer]: error while applying state overrides after TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS: " +
              e.message
          );
        });
    }

    return result;
  }
);
