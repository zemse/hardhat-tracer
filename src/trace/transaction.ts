// export type AbstractParams = { [key: string]: any };

import { TracerDependencies } from "../types";
import { CallItem, Item } from "../utils";
import { format } from "./opcodes";
import { CALL } from "./opcodes/call";

export class TransactionTrace {
  top?: CallItem;
  parent?: CallItem;

  insertItem(item: Item<any>, options?: { increaseDepth: boolean }): void {
    if (item.params === undefined) {
      item.params = {} as any;
    }

    if (!this.top || !this.parent) {
      // if top and parent not set, then this is the first item, should be a call
      this.top = (item as unknown) as CallItem;
      this.parent = this.top;
      if (!this.parent.children) this.parent.children = [];
    } else {
      // insert this item in the parent item's children array
      this.parent.children.push(item);

      // set the parent of the item
      item.parent = this.parent;

      // // if the item is a call, then further items should be it's children
      if (options?.increaseDepth) {
        item.children = [];
        this.parent = (item as unknown) as CallItem;
      }
    }
  }

  // TODO see how to do this
  returnCurrentCall(returnData: string, success: boolean) {
    if (!this.parent) throw new Error("this.parent is undefined");
    this.parent.params.returnData = returnData;
    this.parent.params.success = success;
    this.parent = this.parent.parent as CallItem;
  }

  // TODO make dependencies optional
  async print(dependencies: TracerDependencies) {
    if (!this.top) throw new Error("this.top is undefined");
    await print(dependencies, 0, this.top);
  }
}

async function print(
  dependencies: TracerDependencies,
  depth = 0,
  item: Item<any>
) {
  const indentation = "   ".repeat(depth);

  console.log(indentation + (await format(item, dependencies)));

  if (!!item.children) {
    for (const childItem of item.children) {
      await print(dependencies, depth + 1, childItem);
    }
  }
}
