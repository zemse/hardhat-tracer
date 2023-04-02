import { ethers } from "ethers";
import { task } from "hardhat/config";

import { formatCall } from "../format/call";
import { formatError } from "../format/error";
import { addCliParams, removeColor } from "../utils";

addCliParams(task("decode", "Decodes calldata or error data"))
  .addParam("data", "Calldata or error data to decode")
  .addOptionalParam("returndata", "Return data if any")
  .setAction(async (args, hre) => {
    const td = {
      artifacts: hre.artifacts,
      tracerEnv: hre.tracer,
      provider: hre.network.provider,
      nameTags: hre.tracer.nameTags,
    };

    // see if the data is a call
    const formattedCallPromise = formatCall(
      ethers.constants.AddressZero,
      args.data,
      args.returndata ?? "0x",
      0,
      0,
      0,
      true,
      td
    );

    const formattedErrorPromise = formatError(args.data, td);

    const formattedCall = await formattedCallPromise;
    const uncolored = removeColor(formattedCall);
    if (
      !uncolored.startsWith("UnknownContractAndFunction(") &&
      !uncolored.includes("<UnknownFunction>")
    ) {
      console.log(formattedCall);
    } else {
      // see the data is an error
      const formattedError = await formattedErrorPromise;
      if (!removeColor(formattedError).includes("UnknownError(")) {
        console.log(formattedError);
      } else {
        console.log("Failed to decode the data");
        console.log(formattedCall);
      }
    }
  });
