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

## Type extensions

Type extensions need to be updated to extend the corresponding module where the type is declared.

For example, to extend the `HardhatRuntimeEnvironment`, the following would suffice:

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

Type extensions are now loaded by plugin users through an annotation in a Typescript module like this:
```typescript
/// <reference types="<npm package name>" />
```

## README.md

Make sure to update the README to point to the Hardhat URL (https://usehardhat.com) instead of buidler.