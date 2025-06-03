import { CallItem, Item } from "./types";

export class TransactionTrace {
  public hash?: string;
  public top?: CallItem;
  public parent?: CallItem;

  public insertItem(
    item: Item<any>,
    options?: { increaseDepth: boolean }
  ): void {
    if (item.params === undefined) {
      item.params = {} as any;
    }

    if (!this.top || !this.parent) {
      // if top and parent not set, then this is the first item, should be a call
      this.top = (item as unknown) as CallItem;
      this.parent = this.top;
      if (!this.parent.children) {
        this.parent.children = [];
      }
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

  public returnCurrentCall(
    returnData: string,
    executionGas: number,
    exception?: any // EvmError
  ) {
    if (!this.parent) {
      throw new Error(
        "[hardhat-tracer]: this.parent is undefined in returnCurrentCall"
      );
    }
    this.parent.params.returnData = returnData;
    this.parent.params.gasUsed = executionGas;
    this.parent.params.success = !exception;
    this.parent.params.exception = exception;
    this.parent = this.parent.parent as CallItem;
  }
}
