# Buidler to Hardhat plugin migration guide

## Plugin source code

Replace all types or imported names that include `Buidler` with `Hardhat` in your plugin source code.

For example, the `BuidlerRuntimeEnvironment` should be replaced with the `HardhatRuntimeEnvironment`. We suggest using `hre` instead of `bre` as its variable name.

## Dependencies

### Core

References to the `@nomiclabs/buidler` package should be replaced with the `hardhat` package.
- In your package.json.
- In all your imports or requires.

For example, you would import the `extendEnvironment` function this way:

```typescript
import { extendEnvironment } from "hardhat/config";

```


### Plugins

Similarly, references to buidler plugins should be replaced with their corresponding hardhat plugins.
For example, `@nomiclabs/buidler-ethers` would be `@nomiclabs/hardhat-ethers`.

## Tests

Apart from updating types and names, fixture projects need their `buidler.config.js` renamed to `hardhat.config.js`.

### Hardhat configuration

The compiler configuration is now expected in the `solidity` field instead of `solc`. Note that Hardhat projects allow multiple solidity versions in its compilation pipeline. For more information see its [documentation](https://usehardhat.com/compilation).

If your compiler configuration specifies the optimizer settings, then you'll need to do so like this:

```js
module.exports = {
    solidity: {
        version: "0.7.2"
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    }
}
```

## Type extensions

While you can import all the necessary types from `hardhat/types`, this doesn't work for extending interfaces. For example, you can do something like `import { HardhatRuntimeEnvironment } from "hardhat/types";`, but if you want to extend that interface you need to do something like this:

```typescript
import "hardhat/types/runtime";
import { ExampleHardhatRuntimeEnvironmentField } from "./ExampleHardhatRuntimeEnvironmentField";

declare module "hardhat/types/runtime" {
  // This is an example of an extension to the Hardhat Runtime Environment.
  // This new field will be available in tasks' actions, scripts, and tests.
  export interface HardhatRuntimeEnvironment {
    example: ExampleHardhatRuntimeEnvironmentField;
  }
}
```

Extending a configuration type can be done in a similar fashion:

```typescript
import "hardhat/types/config";

declare module "hardhat/types/config" {
  // This is an example of an extension to one of the Hardhat config values.
  export interface ProjectPaths {
    newPath?: string;
  }
}
```

### User side

Previously, type extensions were loaded by plugin users by adding references to a plugin-owned `type-extensions.d.ts` in their `tsconfig.json`.

Now, they're loaded by plugin users through an annotation in a Typescript module like this:

```typescript
/// <reference types="<npm package name>" />
```

This typescript module needs to be added to their `tsconfig.json`.

## README.md

Make sure to update the README to point to the new Hardhat site (https://usehardhat.com).