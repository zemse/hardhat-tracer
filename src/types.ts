import { VM } from "@nomicfoundation/ethereumjs-vm";
import { Artifacts, EthereumProvider } from "hardhat/types";
import { TraceRecorder } from "./trace/recorder";
import { Decoder } from "./decoder";
import { BigNumberish } from "ethers";

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
  // todo remove internal
  _internal: {
    tokenDecimalsCache: Map<string, number>;
    printNameTagTip:
      | undefined // meaning "no need to print"
      | "print it"
      | "already printed";
  };
  recorder?: TraceRecorder;
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
    bytecode?: string;
    balance?: BigNumberish;
    nonce?: BigNumberish;
  };
}
