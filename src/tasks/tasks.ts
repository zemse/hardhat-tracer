import { cwd } from "node:process";
import fs from "fs";
import path from "path";
import { task } from "hardhat/config";

import { addCliParams, applyCliArgsToTracer } from "../utils";
import { wrapHardhatProvider } from "../wrapper";

// Tasks lists
const DEFAULT_TASKS = ["test", "node"];
const USER_TASKS = [];

// User config
const configFile = "tracer.config.json";
const configFilePath = path.resolve(cwd(), configFile);
if (fs.existsSync(configFilePath)) {
  const config = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
  USER_TASKS.push(...config.tasks);
}

// Add tasks
for (const taskName of [...DEFAULT_TASKS, ...USER_TASKS]) {
  addCliParams(task(taskName, `Run hardhat: ${taskName}`)).setAction(
    async (args, hre, runSuper) => {
      applyCliArgsToTracer(args, hre);

      wrapHardhatProvider(hre);

      return runSuper(args);
    }
  );
}
