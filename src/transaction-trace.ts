import { CALL_OPCODES, CallItem, Item, TraceCallItem } from "./types";

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

  static fromTraceCall(items: TraceCallItem[]): TransactionTrace {
    let topCallItem: CallItem | undefined;
    for (const item of items) {
      const callItem: CallItem = {
        opcode: item.action.callType.toUpperCase() as CALL_OPCODES,
        params: {
          from: item.action.from,
          to: item.action.to,
          value: item.action.value,
          inputData: item.action.input,
          gasLimit: parseInt(item.action.gas),
          success: !item.error,
        },
        children: [],
      };
      if (item.result) {
        callItem.params.returnData = item.result.output;
        callItem.params.exception = item.error;
        callItem.params.gasUsed = parseInt(item.result.gasUsed);
        callItem.params.success = !item.error;
      }

      if (item.traceAddress.length === 0) {
        // this is the top level call
        topCallItem = callItem;
      } else {
        let ptr = topCallItem;
        for (let i = 0; i < item.traceAddress.length; i++) {
          const idx = item.traceAddress[i];
          const isLast = i === item.traceAddress.length - 1;
          if (isLast) {
            if (ptr?.children.length !== idx) {
              throw new Error(
                `[hardhat-tracer]: trace is not sorted. TraceAddress: ${item.traceAddress}, cannot insert at index ${idx}, current level has ${ptr?.children.length} entries already.`
              );
            }
            ptr?.children.push(callItem);
          } else {
            ptr = ptr?.children?.[idx] as CallItem;
          }
        }
      }
    }
    const trace = new TransactionTrace();
    trace.top = topCallItem;
    return trace;
  }
}
