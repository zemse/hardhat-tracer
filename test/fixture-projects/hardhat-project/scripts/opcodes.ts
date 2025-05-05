import hre from "hardhat";

import { wrapTracer } from "../../../../src/wrapper";
import { constants } from "ethers";
import { MathOpcode } from "../../../opcodes/math";

wrapTracer(hre, hre.network.provider);
hre.tracer.enabled = true;
hre.tracer.verbosity = 3;

const {
  MaxInt256,
  MinInt256,
  MaxUint256,
} = constants

const onlyPrint = async (opcode: MathOpcode | MathOpcode[], fn: () => Promise<void>) => {
  const opcodes = Array.isArray(opcode) ? opcode : [opcode]
  // console.log('checking %o', opcodes)
  opcodes.forEach((o) => hre.tracer.opcodes.add(o))
  await fn()
  opcodes.forEach((o) => hre.tracer.opcodes.delete(o))
}

async function main() {
  hre.config.solidity.compilers[0].settings.enabled = false
  const opcodes = await hre.ethers.deployContract("OpCodes");

  try {
    console.log('addInt256')
    await onlyPrint('ADD', () => (
      opcodes.addInt256([
        1, 1, 2,
        1, -1, 0,
        -1, 1, 0,
        -1, -1, -2,
        MaxInt256.toBigInt(), 1, MinInt256.toBigInt(),
        MinInt256.toBigInt(), -1, MaxInt256.toBigInt(),
      ])
    ))
    console.log('subInt256')
    await onlyPrint('SUB', () => (
      opcodes.subInt256([
        1, 1, 0,
        1, -1, 2,
        -1, 1, -2,
        -1, -1, 0,
        MaxInt256.toBigInt(), -1, MinInt256.toBigInt(),
        MinInt256.toBigInt(), 1, MaxInt256.toBigInt(),
      ])
    ))
    console.log('mulInt256')
    await onlyPrint('MUL', () => (
      opcodes.mulInt256([
        1, 1, 1,
        1, -1, -1,
        -1, 1, -1,
        -1, -1, 1,
        MaxInt256.toBigInt(), -1, MinInt256.toBigInt() + 1n,
        MinInt256.toBigInt(), -1, MinInt256.toBigInt(), // this is fun
        MaxInt256.toBigInt(), 1, MaxInt256.toBigInt(),
        MinInt256.toBigInt(), 1, MinInt256.toBigInt(),
      ])
    ))
    console.log('divInt256')
    await onlyPrint('SDIV', () => (
      opcodes.divInt256([
        1, 1, 1,
        1, -1, -1,
        -1, 1, -1,
        -1, -1, 1,
        MaxInt256.toBigInt(), -1, MinInt256.toBigInt() + 1n,
        MinInt256.toBigInt(), -1, MinInt256.toBigInt(), // this is fun
      ])
    ))
    console.log('divUint256')
    await onlyPrint('DIV', () => (
      opcodes.divUint256([
        2, 2, 1,
        MaxUint256.toBigInt(), MaxUint256.toBigInt(), 1n,
      ])
    ))
    await onlyPrint('MOD', () => (
      opcodes.modUint256([
        2, 3, 2,
        MaxUint256.toBigInt(), MaxUint256.toBigInt(), 0n,
      ])
    ))
    await onlyPrint('SMOD', () => (
      opcodes.modInt256([
        -2, 3, -2,
        MinInt256.toBigInt(), 3n, -2n,
      ])
    ))
    await onlyPrint('MULMOD', () => (
      opcodes.mulModUint256([
        2, 3, 4, 2,
      ])
    ))
    await onlyPrint('ADDMOD', () => (
      opcodes.addModUint256([
        2, 3, 4, 1,
      ])
    ))
    await onlyPrint('ISZERO', () => (
      opcodes.isZeroUint256([
        1, 0,
        0, 1,
      ])
    ))
    await onlyPrint('NOT', () => (
      opcodes.notInt256([
        1, -2,
        10, -11,
        MaxInt256.toBigInt(), MinInt256.toBigInt(),
      ])
    ))
    await onlyPrint('EXP', () => (
      opcodes.expUint256([
        1, 5, 1,
        10, 5, 100_000,
      ])
    ))
    await onlyPrint('LT', () => (
      opcodes.ltUint256([
        1, 2, 1,
        2, 1, 0,
      ])
    ))
    await onlyPrint('SLT', () => (
      opcodes.sltInt256([
        -1, -2, 0,
        -2, -1, 1,
        -1, 1, 1,
        1, -1, 0,
        1, 2, 1,
        2, 1, 0,
      ])
    ))
    await onlyPrint('GT', () => (
      opcodes.gtUint256([
        1, 2, 0,
        2, 1, 1,
      ])
    ))
    await onlyPrint('SGT', () => (
      opcodes.sgtInt256([
        -1, -2, 1,
        -2, -1, 0,
        -1, 1, 0,
        1, -1, 1,
        1, 2, 0,
        2, 1, 1,
      ])
    ))
    await onlyPrint('EQ', () => (
      opcodes.eqUint256([
        0, 1, 0,
        1, 1, 1,
      ])
    ))
    await onlyPrint('AND', () => (
      opcodes.andUint256([
        15, 5, 5,
        115, 5, 1,
      ])
    ))
    await onlyPrint('OR', () => (
      opcodes.orUint256([
        15, 5, 15,
        115, 5, 119,
      ])
    ))
    await onlyPrint('XOR', () => (
      opcodes.xorUint256([
        15, 5, 10,
        115, 5, 118,
      ])
    ))
    await onlyPrint('SHL', () => (
      opcodes.shlUint256([
        15, 1, 30,
      ])
    ))
    await onlyPrint('SHR', () => (
      opcodes.shrUint256([
        15, 1, 7,
      ])
    ))
    await onlyPrint('SAR', () => (
      opcodes.sarInt256([
        15, 1, 7,
        // does not trigger with negative numbers?
        // -15, 1, -8,
      ])
    ))
  } catch (e) {
    console.log(e)
    console.log(hre.tracer.lastTrace()?.top?.params.exception);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);
