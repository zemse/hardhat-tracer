import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { AwaitedItem, Item } from "../types";
import { colorLabel, colorMath } from "../utils";

let coerceMathOperations = true

type PossibleNumber = bigint | `0x${string}`;

export interface MATH {
  inputCount: number;
  a: PossibleNumber;
  b: PossibleNumber | boolean;
  c: PossibleNumber | boolean;
  d: PossibleNumber | boolean;
}

const math1Operators = {
  ISZERO: '== 0',
  NOT: '~',
} as const

export type Math1Opcode = keyof typeof operators
export const math1Opcodes = new Set<Math1Opcode>(
  Object.keys(math1Operators) as Math1Opcode[]
)

const math2Operators = {
  ADD: '+',
  SUB: '-',
  MUL: '*',
  DIV: '/',
  SDIV: '/',
  MOD: '%',
  SMOD: '%',
  EXP: '**',
  LT: '<',
  SLT: '<',
  GT: '>',
  SGT: '>',
  EQ: '==',
  AND: '&',
  OR: '|',
  XOR: '^',
  SHL: '<<',
  SHR: '>>',
  SAR: '>>',
  SIGNEXTEND: 'sext',
} as const

export type Math2Opcode = keyof typeof math2Operators
export const math2Opcodes = new Set<Math2Opcode>(
  Object.keys(math2Operators) as Math2Opcode[]
)

const defaultMath1 = {
  inputCount: 1,
  c: 0n,
  d: 0n,
}
const defaultMath2 = {
  inputCount: 2,
  d: 0n,
}
const defaultMath3 = {
  inputCount: 3,
}

const math3Operators = {
  ADDMOD: '+%',
  MULMOD: '*%',
} as const

export type Math3Opcode = keyof typeof math3Operators
export const math3Opcodes = new Set<Math3Opcode>(
  Object.keys(math3Operators) as Math3Opcode[]
)

export const operators = {
  ...math1Operators,
  ...math2Operators,
  ...math3Operators,
} as const

export type MathOpcode = Math1Opcode | Math2Opcode | Math3Opcode

export const ops = new Set<MathOpcode>([
  ...math1Opcodes.values(),
  ...math2Opcodes.values(),
  ...math3Opcodes.values(),
])

const truthyOpcodesList = [
  'LT',
  'GT',
  'SLT',
  'SGT',
  'EQ',
  'ISZERO',
] as const
export type TruthyOpcode = typeof truthyOpcodesList[number]
const truthyOpcodes = new Set<TruthyOpcode>(truthyOpcodesList)

const bestAsHexList = [
  'AND',
  'OR',
  'XOR',
  'SIGNEXTEND',
] as const
export type BestAsHexOpcode = typeof bestAsHexList[number]
const bestAsHex = new Set<BestAsHexOpcode>(bestAsHexList)

type Op2Checker = (a: bigint, b: bigint, c: bigint) => boolean
type Op3Checker = (a: bigint, b: bigint, c: bigint, d: bigint) => boolean

const toBool = (n: bigint) => BigInt(n) === 1n

const divOperation: Op2Checker = (a, b, c) => (
  ((a / b) === c)
)
const ltOperation: Op2Checker = (a, b, c) => (
  ((a < b) === toBool(c))
)
const gtOperation: Op2Checker = (a, b, c) => (
  ((a > b) === toBool(c))
)
const modOperation: Op2Checker = (a, b, c) => (
  (a % b === c)
)
const operations2 = new Map<Math2Opcode, Op2Checker>([
  ['ADD', (a, b, c) => (
    a + b === c
  )],
  ['SUB', (a, b, c) => (
    a - b === c
  )],
  ['MUL', (a, b, c) => (
    a * b === c
  )],
  ['DIV', divOperation],
  ['SDIV', divOperation],
  ['LT', ltOperation],
  ['SLT', ltOperation],
  ['GT', gtOperation],
  ['SGT', gtOperation],
  ['MOD', modOperation],
  ['SMOD', modOperation],
  ['EXP', (a, b, c) => (
    (a ** b === c)
  )],
  ['EQ', (a, b, c) => ((a === b) === toBool(c))],
  ['SHL', (a, b, c) => (a << b) === c],
  ['SHR', (a, b, c) => (a >> b) === c],
  ['SAR', (a, b, c) => (a >> b) === c],
])

const reversedInput = new Set<Math2Opcode>([
  'SHR',
  'SHL',
  'SAR',
])

const operations3 = new Map<Math3Opcode, Op3Checker>([
  ['ADDMOD', (a, b, c, d) => (
    (a + b) % c === d
  )],
  ['MULMOD', (a, b, c, d) => (
    (a * b) % c === d
  )],
])

const checkOperation3 = (
  opcode: Math3Opcode,
  a: bigint, b: bigint, c: bigint, d: bigint,
) => {
  const op = operations3.get(opcode)!
  if (op(a, b, c, d)) return { a, b, c, d, ...defaultMath3 }
}

const checkOperation2 = (
  opcode: Math2Opcode,
  a: bigint, b: bigint, c: bigint,
  count = 0,
): MATH | null => {
  let negA = -a
  let negB = -b
  let negC = -c
  const op = operations2.get(opcode)!

  if (op(a, b, c)) return { a, b, c, ...defaultMath2 }
  else if (op(a, negB, c)) return { a, b: negB, c, ...defaultMath2 }
  else if (op(negA, b, c)) return { a: negA, b, c, ...defaultMath2 }
  else if (op(negA, negB, c)) return { a: negA, b: negB, c, ...defaultMath2 }
  else if (op(a, b, negC)) return { a, b, c: negC, ...defaultMath2 }
  else if (op(a, negB, negC)) return { a, b: negB, c: negC, ...defaultMath2 }
  else if (op(negA, b, negC)) return { a: negA, b, c: negC, ...defaultMath2 }
  else if (op(negA, negB, negC)) return { a: negA, b: negB, c: negC, ...defaultMath2 }
  if (count === 1) {
    return null
  } else {
    negA = BigInt.asUintN(256, negA)
    negB = BigInt.asUintN(256, negB)
    negC = BigInt.asUintN(256, negC)
    return checkOperation2(opcode, negA, negB, negC, ++count)
  }
}

const asHex = (a: bigint, b: bigint, c: bigint = 0n, d: bigint = 0n) => ({
  a: `0x${a.toString(16)}`,
  b: `0x${b.toString(16)}`,
  c: `0x${c.toString(16)}`,
  d: `0x${d.toString(16)}`,
} as const)

function parse(step: MinimalInterpreterStep): AwaitedItem<MATH> {
  const { stack, opcode } = step
  const len = stack.length
  // should never be an issue, but this just makes
  // sure that the index will never be zero
  let c = stack[Math.max(0, len - 3)]
  let b = stack[Math.max(0, len - 2)]
  let a = stack[Math.max(0, len - 1)]
  if (reversedInput.has(opcode.name as Math2Opcode)) {
    const tmp = a
    a = b
    b = tmp
  }
  return {
    isAwaitedItem: true,
    next: 1,
    parse: (stepNext: MinimalInterpreterStep) => {
      const result = stepNext.stack[stepNext.stack.length - 1]
      // assume that numbers close to 0 are going to be
      // what is actually being used / most useful to viewers
      // might be worth putting this or even the entirity
      // of hex->bigint conversion behind a flag
      let params!: MATH
      const inputCount = math1Opcodes.has(opcode.name as Math1Opcode) ? 1
        : math2Opcodes.has(opcode.name as Math2Opcode) ? 2
          : math3Opcodes.has(opcode.name as Math3Opcode) ? 3
            : 0
      if (inputCount === 1) {
        params = {
          ...defaultMath1,
          // best to just leave this in hex
          // either it's "iszero", and 0 is similar enough to 0x0
          // or it is "not", which is better as hex anyway
          ...asHex(a, result),
        }
        if (truthyOpcodes.has(opcode.name as any)) {
          params.b = toBool(params.b as bigint)
        }
      } else if (inputCount === 2) {
        if (bestAsHex.has(opcode.name as BestAsHexOpcode)) {
          params = { inputCount, ...asHex(a, b, result) }
        } else {
          const p = coerceMathOperations ? checkOperation2(
            opcode.name as Math2Opcode,
            a, b, result,
          ) : null
          if (p) {
            params = p
          } else {
            params = { ...asHex(a, b, result), ...defaultMath2 }
          }
        }
        if (truthyOpcodes.has(opcode.name as any)) {
          params.c = toBool(params.c as bigint)
        }
      } else if (inputCount === 3) {
        const p = coerceMathOperations ? checkOperation3(
          opcode.name as Math3Opcode,
          a, b, c, result,
        ) : null
        if (p) {
          params = p
        } else {
          params = {
            ...asHex(a, b, c, result),
            ...defaultMath3,
          }
        }
      }
      return {
        opcode: opcode.name,
        params,
        format(): string {
          return format(this);
        },
      }
    },
  };
}

const equalColorized = colorMath('=')

function format(item: Item<MATH>): string {
  const { opcode, params } = item
  const { inputCount, a, b, c, d } = params
  // evenly space the opcodes
  const opcodePrint = `${colorLabel(`[${opcode}]`)}${' '.repeat(7 - opcode.length)}`
  if (inputCount === 1) {
    if (opcode === 'NOT') {
      return `${opcodePrint}${colorMath(operators[opcode as Math1Opcode])
        }${a} ${equalColorized} ${b}`
    }
    return `${opcodePrint}${a} ${colorMath(operators[opcode as Math1Opcode])
      } ${equalColorized} ${b}`
  } else if (inputCount === 2) {
    return `${opcodePrint}${a} ${colorMath(operators[opcode as Math2Opcode])
      } ${b} ${equalColorized} ${c}`;
  } else if (inputCount === 3) {
    const operator = operators[opcode as Math3Opcode]
    const [first, second] = operator.split('')
    return `${opcodePrint}${a} ${colorMath(first)} ${b} ${colorMath(second)
      } ${c} ${equalColorized} ${d}`
  } else {
    throw new Error('unknown operator count')
  }
}

export { parse, format };
