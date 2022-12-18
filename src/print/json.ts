import { format } from "../opcodes";
import { TransactionTrace } from "../transaction-trace";
import { Item, TracerDependencies } from "../types";

export async function printJson(txTrace: TransactionTrace) {
  if (!txTrace.top) {
    throw new Error("[hardhat-tracer]: this.top is undefined in print");
  }

  removeParent(txTrace.top);

  console.log(JSON.stringify(txTrace.top, null, 2));
}

export function removeParent(item: Item<any>) {
  item.parent = undefined;
  if (!!item.children) {
    for (const childItem of item.children) {
      removeParent(childItem);
    }
  }
}
