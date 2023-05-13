import { ethers } from "ethers";
import { task } from "hardhat/config";

import { formatLog } from "../format/log";
import { addCliParams } from "../utils";

addCliParams(task("decodelog", "Decodes log data"))
  .addParam("topic0", "topic of log to decode")
  .addOptionalParam("topic1", "data if any")
  .addOptionalParam("topic2", "data if any")
  .addOptionalParam("topic3", "data if any")
  .addOptionalParam("data", "data if any")
  .setAction(async (args, hre) => {
    const td = {
      artifacts: hre.artifacts,
      tracerEnv: hre.tracer,
      provider: hre.network.provider,
      nameTags: hre.tracer.nameTags,
    };


    let topics = [args.topic0, args.topic1, args.topic2, args.topic3];
    topics = topics.filter((topic) => topic !== undefined);

    // see if the data is a call
    const formattedlogPromise = formatLog(
      {
        data: args.data ?? "0x",
        topics: topics,
      },
      ethers.constants.AddressZero,
      td
    );

    const formattedCall = await formattedlogPromise;
    console.log(formattedCall);
  });
