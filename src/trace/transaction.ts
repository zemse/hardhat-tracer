// export type AbstractParams = { [key: string]: any };

import { TracerDependencies } from "../types";
import { format } from "./opcodes";

export interface Item<Params> {
  opcode: string;
  params: Params;
  parent?: Item<Params>;
  children?: Item<Params>[];
  format?: () => string;
}

export interface CallParams {
  to?: string;
  inputData: string;
  value: string; // hex string
  returnData?: string;
  gasLimit: number;
  gasUsed?: number;
}

export interface CallItem extends Item<CallParams> {
  opcode: CALL_OPCODES;
  children: Item<any>[];
}

// interface CallItem extends Item {
//   opcode: CALL_OPCODES;
//   params: {
//     to?: string;
//     inputData: string;
//     value: string; // hex string
//     returnData?: string;
//     gasLimit: number;
//     gasUsed?: number;
//   };
//   children: Item[];
// }

type CALL_OPCODES =
  | "CALL"
  | "STATICCALL"
  | "DELEGATECALL"
  | "CALLCODE"
  | "CREATE"
  | "CREATE2";

const callOpcodes = [
  "CALL",
  "STATICCALL",
  "DELEGATECALL",
  "CALLCODE",
  "CREATE",
  "CREATE2",
];
export class TraceTransaction {
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
  returnCurrentCall(returnData: string) {
    if (!this.parent) throw new Error("this.parent is undefined");
    this.parent.params.returnData = returnData;
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
