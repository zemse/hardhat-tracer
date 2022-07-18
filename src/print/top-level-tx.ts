import { getContractAddress } from "ethers/lib/utils";
import { colorLabel } from "../colors";
import { TracerDependenciesExtended } from "../types";
import { parseUint } from "../utils";
import { formatCall } from "../format/call";
import { formatContract } from "../format/contract";

export async function printTopLevelTx(
  txHash: string,
  addressStack: Array<string | undefined>,
  dependencies: TracerDependenciesExtended
) {
  const tx = await dependencies.provider.send("eth_getTransactionByHash", [
    txHash,
  ]);

  if (
    tx.to !== null &&
    tx.to !== "0x" &&
    tx.to !== "0x0000000000000000000000000000000000000000"
  ) {
    // normal transaction
    console.log(
      colorLabel("CALL") +
        " " +
        (await formatCall(
          tx.to,
          tx.input,
          "0x",
          tx.value,
          tx.gas,
          dependencies
        ))
    );
    addressStack.push(tx.to);
  } else {
    // contract deploy transaction
    const str = await formatContract(
      tx.input,
      parseUint(tx.value ?? "0x"),
      null,
      getContractAddress(tx),
      dependencies
    );
    addressStack.push(getContractAddress(tx));
    console.log(colorLabel("CREATE") + " " + str);
  }
}
