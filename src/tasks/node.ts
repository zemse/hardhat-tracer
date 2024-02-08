import { EIP1193Provider, HardhatRuntimeEnvironment, RequestArguments } from "hardhat/types";
import { ProviderLike } from "../types";
import { runTask, createTracerTask } from "../utils";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import { wrapProvider } from "../wrapper";
import { subtask } from "hardhat/config";
import { TASK_NODE_GET_PROVIDER } from "hardhat/builtin-tasks/task-names";
import { addRecorder } from "../extend/hre";


createTracerTask("node").setAction(runTask);

subtask(TASK_NODE_GET_PROVIDER).setAction(
    async (args, hre, runSuper) => {
        const provider = await runSuper(args);
        wrapProvider(hre, new RpcWrapper(hre, provider));
        addRecorder(hre);
        return hre.network.provider
      }
)

class RpcWrapper extends ProviderWrapper {
    constructor(public hre: HardhatRuntimeEnvironment, public provider: ProviderLike) {
      super((provider as unknown) as EIP1193Provider);
    }

    public async request({method, params}: RequestArguments): Promise<unknown> {
        if(method === "tracer_lastTrace") {
            let trace = this.hre.tracer.lastTrace();
            return JSON.parse(JSON.stringify(trace, (k, v) => (k === "parent") ? undefined : v));
        }
        return await this.provider.send(method, params as any[]);
    }
}
