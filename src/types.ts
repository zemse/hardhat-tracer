import { Artifacts, EthereumProvider } from "hardhat/types";

export interface NameTags {
  [address: string]: string;
}

export interface TracerEnv {
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
