import { EdrProviderWrapper } from "hardhat/internal/hardhat-network/provider/provider";

export class Switch {
  edrProvider: EdrProviderWrapper;
  verboseEnabled: boolean;

  constructor(edrProvider: EdrProviderWrapper) {
    this.edrProvider = edrProvider;
    this.verboseEnabled = false;
  }

  async enable() {
    this.verboseEnabled = true;
    // @ts-ignore
    await this.edrProvider._setVerboseTracing(true);
  }

  async disable() {
    this.verboseEnabled = false;
    // @ts-ignore
    await this.edrProvider._setVerboseTracing(false);
  }
}
