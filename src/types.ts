import { Artifacts, EthereumProvider } from "hardhat/types";

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
}

export interface TracerEnv {
  enabled: boolean;
  logs: boolean;
  calls: boolean;
  sstores: boolean;
  sloads: boolean;
  gasCost: boolean;
  opcodes: string[];
  nameTags: NameTags;
  _internal: {
    printNameTagTip:
      | undefined // meaning "no need to print"
      | "print it"
      | "already printed";
  };
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
