import fs from "fs-extra";
import path from "path";

import { I4BytesEntry } from "./types";

// To locally cache contract name, decimals, and ABI to prevent async API calls
export class TracerCache {
  public tokenDecimals: Map<string, number> = new Map();
  public contractNames: Map<string, string> = new Map();
  public fourByteDir: Map<string, I4BytesEntry[]> = new Map();

  public cachePath: string | undefined;

  public setCachePath(cachePath: string) {
    this.cachePath = cachePath;
  }

  public load() {
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

  public save() {
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

  public getTracerCachePath() {
    if (!this.cachePath) {
      throw new Error("[hardhat-tracer]: cachePath not set");
    }
    return path.join(this.cachePath, "hardhat-tracer-cache", `data.json`);
  }
}
