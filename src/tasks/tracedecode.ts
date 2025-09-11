import createDebug from "debug";
import { ethers } from "ethers";
import { task } from "hardhat/config";
import { HttpNetworkUserConfig } from "hardhat/types";
import { TransactionTrace } from "../transaction-trace";
import { readJson } from "fs-extra";

import { print } from "../print";
import { addCliParams, applyCliArgsToTracer, colorError } from "../utils";
import { addRecorder } from "../extend/hre";
import { printConsole } from "../print/console";
import path from "node:path";

const debug = createDebug("hardhat-tracer:tasks:tracedecode");

addCliParams(task("tracedecode", "Decodes an already generated trace"))
  .addOptionalPositionalParam("input", "trace input or path to json file")
  .addFlag("stdin", "Use stdin")
  .setAction(async (args, hre, runSuper) => {
    applyCliArgsToTracer(args, hre);

    if (!args.nocompile) {
      await hre.run("compile");
    }

    let input;
    const shouldReadStdin = args.stdin || input === "-" || !process.stdin.isTTY;

    if (shouldReadStdin) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
      input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } else {
      if (args.input === undefined) {
        console.error(
          colorError(
            "Error: no input provided, provide some positional input or you can use --stdin"
          )
        );
        process.exit(1);
      }

      try {
        input = JSON.parse(args.input);
      } catch (e) {
        if (args.input.length < 500) {
          const fullPath = path.join(process.cwd(), args.input);
          input = await readJson(fullPath);
        } else {
          console.error(colorError(`Error parsing input as JSON: ${e}`));
          process.exit(1);
        }
      }
    }

    const result = TransactionTrace.fromTraceCall(input);
    await printConsole(result, {
      tracerEnv: hre.tracer,
      artifacts: hre.artifacts,
      provider: hre.ethers.provider,
    });
  });
