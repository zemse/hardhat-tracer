import { VM } from "@nomicfoundation/ethereumjs-vm";
import {
  getOpcodesForHF,
  Opcode,
} from "@nomicfoundation/ethereumjs-evm/dist/opcodes";

export function checkIfOpcodesAreValid(opcodes: Map<string, boolean>, vm: VM) {
  // fetch the opcodes which work on this VM
  let activeOpcodesMap = new Map<string, boolean>();
  for (const opcode of getOpcodesForHF(vm._common).opcodes.values()) {
    activeOpcodesMap.set(opcode.fullName, true);
  }

  // check if there are any opcodes specified in tracer which do not work
  for (const opcode of opcodes.keys()) {
    if (!activeOpcodesMap.get(opcode)) {
      throw new Error(
        `[hardhat-tracer]: The opcode "${opcode}" is not active on this VM. If the opcode name is misspelled in the config, please correct it.`
      );
    }
  }
}
