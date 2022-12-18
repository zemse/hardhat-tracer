import { CALL_OPCODES, CallItem, Item } from "../types";

export function isItem(item: any): item is Item<any> {
  return item && typeof item.opcode === "string";
}

export const callOpcodes = [
  "CALL",
  "STATICCALL",
  "DELEGATECALL",
  "CALLCODE",
  "CREATE",
  "CREATE2",
] as const;

export function isCallItem(item: Item<any>): item is CallItem {
  return callOpcodes.includes(item.opcode as CALL_OPCODES);
}
