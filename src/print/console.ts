import { format } from "../opcodes";
import { TransactionTrace } from "../transaction-trace";
import { Item, TracerDependencies } from "../types";

// TODO make dependencies optional
export async function printConsole(
  txTrace: TransactionTrace,
  dependencies: TracerDependencies
) {
  if (!txTrace.top) {
    throw new Error("[hardhat-tracer]: this.top is undefined in print");
  }
  await printCall(dependencies, 0, txTrace.top);
}

async function printCall(
  dependencies: TracerDependencies,
  depth = 0,
  item: Item<any>
) {
  const indentation = "   ".repeat(depth);

  console.log(indentation + (await format(item, dependencies)));

  if (!!item.children) {
    for (const childItem of item.children) {
      if (!childItem.noFormat) {
        await printCall(dependencies, depth + 1, childItem);
      }
    }
  }
}
