import { Assertion } from "chai";
import { BigNumber, PopulatedTransaction } from "ethers";

import { TransactionTrace } from "../transaction-trace";
import { CallItem, ChaiMessageCallOptions } from "../types";
import { hexPrefix, isCallItem } from "../utils";

Assertion.addMethod("messageCall", function (
  tx: PopulatedTransaction,
  options: ChaiMessageCallOptions = {}
) {
  // TODO add typecheck/sanitycheck for this.object
  const transactionTrace: TransactionTrace = this._obj;

  const { error } = messageCallToBePresentIn_sync(
    tx,
    transactionTrace.top!,
    options
  );
  if (error) {
    throw error;
  }
});

function messageCallToBePresentIn_sync(
  tx: PopulatedTransaction,
  callItem: CallItem,
  options: ChaiMessageCallOptions
) {
  let { matchQuotient, error } = checkEqual(tx, callItem, options);

  if (callItem.children) {
    for (const childCallItem of callItem.children) {
      if (isCallItem(childCallItem)) {
        const {
          matchQuotient: _matchQuotient,
          error: _error,
        } = messageCallToBePresentIn_sync(tx, childCallItem, options);

        // if a more suitable item was found, bubble up it's error.
        if (_matchQuotient > matchQuotient) {
          matchQuotient = _matchQuotient;
          error = _error;
        }
      }
    }
  }

  return { matchQuotient, error };
}

function checkEqual(
  tx: PopulatedTransaction,
  item: CallItem,
  options: ChaiMessageCallOptions
): { matchQuotient: number; error: Error | undefined } {
  // console.log(item.params);

  // for contract creation, to is undefined, and note that undefined === undefined is true.
  const isToSame =
    tx.to === undefined ||
    tx.to?.toLowerCase() === item.params.to?.toLowerCase();
  const isFromSame =
    options.from === undefined ||
    options.from?.toLowerCase() === item.params.from?.toLowerCase();

  const isDataSame =
    hexPrefix(tx.data ?? "0x").toLowerCase() === item.params.inputData;

  let matchQuotient = 0;
  let error: Error | undefined;

  // basic matching requirement
  if (!isToSame || !isFromSame || !isDataSame) {
    error = new Error("Call does not match");
    return { error, matchQuotient };
  }
  matchQuotient += 1;

  const isValueSame = (tx.value ?? BigNumber.from(0)).eq(
    item.params.value ?? 0
  );
  if (!isValueSame) {
    error = new Error("Call value found to be not matching.");
  }

  if (options.returnData !== undefined) {
    const isReturnDataSame =
      options.returnData.toLowerCase() ===
      item.params.returnData?.toLowerCase();
    if (!isReturnDataSame) {
      error = new Error("Return data found to be not matching.");
    }
  }

  if (options.isStaticCall !== undefined) {
    if (options.isStaticCall !== (item.opcode === "STATICCALL")) {
      error = new Error(
        "Call found to be" +
          (options.isStaticCall ? " not" : "") +
          " STATICCALL."
      );
    } else {
      matchQuotient += 1;
    }
  }
  if (options.isDelegateCall !== undefined) {
    if (options.isDelegateCall !== (item.opcode === "DELEGATECALL")) {
      error = new Error(
        "Call found to be" +
          (options.isDelegateCall ? " not" : "") +
          " DELEGATECALL."
      );
    } else {
      matchQuotient += 1;
    }
  }
  if (options.isSuccess !== undefined) {
    if (options.isSuccess !== item.params.success) {
      error = new Error(
        "Call found to be" + (options.isSuccess ? " not" : "") + " successful."
      );
    } else {
      matchQuotient += 1;
    }
  }

  return { matchQuotient, error };
}
