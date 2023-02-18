import { Artifacts } from "hardhat/types";
import { BigNumberish, PopulatedTransaction } from "ethers";
import { CALL } from "./opcodes/call";
import { Decoder } from "./decoder";
import { InterpreterStep } from "@nomicfoundation/ethereumjs-evm";
import { TracerCache } from "./cache";
import { TraceRecorder } from "./trace-recorder";
import { TransactionTrace } from "./transaction-trace";

type PrintMode = "console" | "json";

export interface NameTags {
  [address: string]: string;
}

export interface TracerEnvUser {
  enabled?: boolean;
  defaultVerbosity?: number;
  showAddresses?: boolean;
  gasCost?: boolean;
  opcodes?: string[];
  nameTags?: NameTags;
  stateOverrides?: StateOverrides;
  tasks?: string[];
}

export interface TracerEnv {
  enabled: boolean;
  ignoreNext: boolean;
  printNext: boolean;
  verbosity: number;
  showAddresses: boolean;
  gasCost: boolean;
  opcodes: Map<string, boolean>; // string[]; // TODO have a map of opcode to boolean
  nameTags: NameTags;
  printMode: PrintMode;
  _internal: {
    cache: TracerCache;
    printNameTagTip:
      | undefined // meaning "no need to print"
      | "print it"
      | "already printed";
  };
  recorder?: TraceRecorder;
  lastTrace: () => TransactionTrace | undefined;
  decoder?: Decoder;
  stateOverrides?: StateOverrides;
}

export interface TracerDependencies {
  artifacts: Artifacts;
  tracerEnv: TracerEnv;
  provider: ProviderLike;
}

export interface TracerDependenciesExtended extends TracerDependencies {
  nameTags: NameTags;
}

export interface ProviderLike {
  send(method: string, params?: any[] | undefined): Promise<any>;
}

export interface StructLog {
  depth: number;
  error: string;
  gas: number;
  gasCost: number;
  memory: string[];
  op: string;
  pc: number;
  stack: string[];
  storage: {};
}

export interface StateOverrides {
  [address: string]: {
    storage?: {
      [slot: string | number]: BigNumberish;
    };
    bytecode?: ContractInfo;
    balance?: BigNumberish;
    nonce?: BigNumberish;
  };
}

export type ContractInfo =
  | string // bytecode in hex or name of the contract
  | {
      name: string;
      libraries?: {
        [libraryName: string]: ContractInfo;
      };
    };

export interface Item<Params> {
  opcode: string;
  params: Params;
  parent?: Item<Params>;
  children?: Item<Params>[];
  format?: () => string;
}

export type AwaitedItem<T> = {
  isAwaitedItem: true;
  next: number;
  parse: (step: InterpreterStep, currentAddress?: string) => Item<T>;
};

export interface CallItem extends Item<CALL> {
  opcode: CALL_OPCODES;
  children: Item<any>[];
}

export type CALL_OPCODES =
  | "CALL"
  | "STATICCALL"
  | "DELEGATECALL"
  | "CALLCODE"
  | "CREATE"
  | "CREATE2";

export interface ChaiMessageCallOptions {
  isStaticCall?: boolean;
  isDelegateCall?: boolean;
  isSuccess?: boolean;
  returnData?: string;
  from?: string;
}

declare global {
  export namespace Chai {
    interface Assertion {
      messageCall(
        tx: PopulatedTransaction,
        options?: ChaiMessageCallOptions
      ): Assertion;
    }
  }
}
