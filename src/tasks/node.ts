import { TASK_NODE_GET_PROVIDER } from "hardhat/builtin-tasks/task-names";
import { subtask } from "hardhat/config";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  EIP1193Provider,
  HardhatRuntimeEnvironment,
  RequestArguments,
} from "hardhat/types";

import { addRecorder } from "../extend/hre";
import { ProviderLike } from "../types";
import { createTracerTask, runTask } from "../utils";
import { wrapProvider } from "../wrapper";

createTracerTask("node").setAction(runTask);

subtask(TASK_NODE_GET_PROVIDER).setAction(async (args, hre, runSuper) => {
  const provider = await runSuper(args);
  wrapProvider(hre, new RpcWrapper(hre, provider));
  addRecorder(hre).catch(console.error);
  return hre.network.provider;
});

class RpcWrapper extends ProviderWrapper {
  constructor(
    public hre: HardhatRuntimeEnvironment,
    public provider: ProviderLike
  ) {
    super((provider as unknown) as EIP1193Provider);
  }

  public async request({ method, params }: RequestArguments): Promise<unknown> {
    if (method === "tracer_lastTrace") {
      const trace = this.hre.tracer.lastTrace();
      return JSON.parse(
        JSON.stringify(trace, (k, v) => (k === "parent" ? undefined : v))
      );
    }
    return this.provider.send(method, params as any[]);
  }
}
