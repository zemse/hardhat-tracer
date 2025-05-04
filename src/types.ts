import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";
import { BigNumberish, PopulatedTransaction } from "ethers";
import { Artifacts } from "hardhat/types";

import { TracerCache } from "./cache";
import { Decoder } from "./decoder";
import { CALL } from "./opcodes/call";
import { TraceRecorder } from "./trace-recorder";
import { TransactionTrace } from "./transaction-trace";
import { Switch } from "./switch";

type PrintMode = "console" | "json";

export interface NameTags {
  [address: string]: string;
}

export interface TracerEnvUser {
  enabled?: boolean; // whether to enable tracer always, default: false
  defaultVerbosity?: number; // default minimum verbosity level, default: 0
  showAddresses?: boolean; // whether to show addresses, default: true
  gasCost?: boolean; // print gas cost for calls, default: false
  enableAllOpcodes?: boolean; // print all opcodes, default: false
  use4bytesDirectory?: boolean; // consult 4byte.directory for ABIs, default: true
  opcodes?: string[]; // list of extra opcodes to print, default: [CALLs, SLOAD, SSTORE, LOG*]
  nameTags?: NameTags; // map of addresses to name strings, default: {}
  stateOverrides?: StateOverrides; // map of addresses to their state overrides, default: {}
  tasks?: string[]; // list of extra tasks to enable tracer on, default: []
}

export interface TracerEnv {
  enabled: boolean;
  ignoreNext: boolean;
  printNext: boolean;
  verbosity: number;
  showAddresses: boolean;
  gasCost: boolean;
  enableAllOpcodes: boolean;
  use4bytesDirectory: boolean;
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
  switch?: Switch;
  /// Recently occured trace
  lastTrace: () => TransactionTrace | undefined;
  /// Last N traces, latest first
  lastTraces: (count: number) => TransactionTrace[] | never;
  /// All traces, oldest first
  allTraces: () => TransactionTrace[];
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
  children?: Array<Item<Params>>;
  format?: () => string;
  noFormat?: boolean;
}

export interface AwaitedItem<T> {
  isAwaitedItem: true;
  next: number;
  parse: (
    step: MinimalInterpreterStep,
    currentAddress?: { value: string }
  ) => Item<T>;
}

export interface CallItem extends Item<CALL> {
  opcode: CALL_OPCODES;
  children: Array<Item<any>>;
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

export interface I4BytesEntry {
  id: number; // 31780
  created_at: string; // "2018-05-11T08:39:29.708250Z";
  text_signature: string; // "many_msg_babbage(bytes1)";
  hex_signature: string; // "0xa9059cbb";
  bytes_signature: string; // "©\x05\x9C»";
}

export interface Obj<V> {
  [key: string]: V;
}

export interface PrecompleResult {
  name: string;
  inputResult?: { [key: string]: any };
  returnResult?: { [key: string]: any };
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
