import { extendEnvironment } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";

import { ExampleHardhatRuntimeEnvironmentField } from "./ExampleHardhatRuntimeEnvironmentField";

// Everything in a plugin must happen inside an exported function
export default function() {
  extendEnvironment(env => {
    // We add a field to the Hardhat Runtime Environment here.
    // We use lazyObject to avoid initializing things until they are actually
    // needed.
    env.example = lazyObject(() => new ExampleHardhatRuntimeEnvironmentField());
  });
}
