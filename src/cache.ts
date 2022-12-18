import fs from "fs-extra";
import path from "path";

// To locally cache contract name, decimals, and ABI to prevent async API calls
export class TracerCache {
  tokenDecimals: Map<string, number> = new Map();
  contractNames: Map<string, string> = new Map();
  fourByteDir: Map<string, string> = new Map();

  cachePath: string | undefined;

  setCachePath(cachePath: string) {
    this.cachePath = cachePath;
  }

  load() {
    fs.ensureFileSync(this.getTracerCachePath());
    let json;
    try {
      json = fs.readJSONSync(this.getTracerCachePath());
    } catch {
      json = {};
    }
    this.tokenDecimals = new Map(json.tokenDecimals ?? []);
    this.contractNames = new Map(json.contractNames ?? []);
    this.fourByteDir = new Map(json.fourByteDir ?? []);
  }

  save() {
    fs.ensureFileSync(this.getTracerCachePath());

    fs.writeJSONSync(
      this.getTracerCachePath(),
      {
        tokenDecimals: Array.from(this.tokenDecimals.entries()),
        contractNames: Array.from(this.contractNames.entries()),
        fourByteDir: Array.from(this.fourByteDir.entries()),
      },
      { spaces: 2 }
    );
  }

  getTracerCachePath() {
    if (!this.cachePath) {
      throw new Error("[hardhat-tracer]: cachePath not set");
    }
    return path.join(this.cachePath, "hardhat-tracer-cache", `data.json`);
  }
}
