import { MinimalEthereumJsVm } from "hardhat/internal/hardhat-network/provider/vm/minimal-vm";

export function checkIfOpcodesAreValid(
  opcodes: Map<string, boolean>,
  vm: MinimalEthereumJsVm
) {
  // TODO add a list of all valid opcodes, need to keep it up to date
  // this is just for sanity purpose
  //
  // TODO fix this code
  // fetch the opcodes which work on this VM
  // const activeOpcodesMap = new Map<string, boolean>();
  // for (const opcode of getOpcodesForHF(vm.common).opcodes.values()) {
  //   activeOpcodesMap.set(opcode.fullName, true);
  // }
  // check if there are any opcodes specified in tracer which do not work
  // for (const opcode of opcodes.keys()) {
  //   if (!activeOpcodesMap.get(opcode)) {
  //     throw new Error(
  //       `[hardhat-tracer]: The opcode "${opcode}" is not active on this VM. If the opcode name is misspelled in the config, please correct it.`
  //     );
  //   }
  // }
}
