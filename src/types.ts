import { VM } from "@nomicfoundation/ethereumjs-vm";
import { Artifacts, EthereumProvider } from "hardhat/types";
import { TraceRecorder } from "./trace/recorder";

export interface NameTags {
  [address: string]: string;
}

export interface TracerEnvUser {
  enabled?: boolean;
  logs?: boolean;
  calls?: boolean;
  sstores?: boolean;
  sloads?: boolean;
  gasCost?: boolean;
  opcodes?: string[];
  nameTags?: NameTags;
}

export interface TracerEnv {
  enabled: boolean;
  ignoreNext: boolean;
  // TODO remove these logs calls and put them into opcodes mapping
  logs: boolean;
  calls: boolean;
  sstores: boolean;
  sloads: boolean;
  gasCost: boolean;
  opcodes: string[]; // TODO have a map of opcode to boolean
  nameTags: NameTags;
  // todo remove internal
  _internal: {
    printNameTagTip:
      | undefined // meaning "no need to print"
      | "print it"
      | "already printed";
  };
  recorder?: TraceRecorder;
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
