# Buidler to Hardhat plugin migration guide

This is a short guide explaining how to turn a Buidler plugin into a Hardhat one.

## Adapting your plugin's source code

Replace all types or imported names that include `Buidler` with `Hardhat` in your plugin source code.

For example, the `BuidlerRuntimeEnvironment` should be replaced with the `HardhatRuntimeEnvironment`. We suggest using `hre` instead of `bre` as its variable name.

## Updating its dependencies

### Core

References to the `@nomiclabs/buidler` package should be replaced with the `hardhat` package in your `package.json`, and your `import`s or `require`s.

For example, you would import the `extendEnvironment` function this way:

```typescript
import { extendEnvironment } from "hardhat/config";
```

### Plugins

Similarly, references to buidler plugins should be replaced with their corresponding hardhat plugins.
For example, `@nomiclabs/buidler-ethers` would be `@nomiclabs/hardhat-ethers`.

## Updating your plugin's tests

Apart from updating types and names, fixture projects need their `buidler.config.js` renamed to `hardhat.config.js`.

### Changes needed to your test projects' config

The compiler configuration is now expected in the `solidity` field instead of `solc`. Note that Hardhat projects allow multiple solidity versions in its compilation pipeline. For more information see its [documentation](https://usehardhat.com/compilation).

If your compiler configuration specifies the `optimizer` setting, then you'll need to do so like this:

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

## Adapting your type extensions

Hardhat introduced a few changes in how type extensions are created and used. These
are the necessary to update your plugin.

First, you need rename your `src/type-extenstions.d.ts` file to `src/type-extensions.ts`.

Then, you need to add an `import "./type-extensions";` in your `src/index.ts` file.

If your plugin depends on other plugins, you need to remove their `type-extension.d.ts` references
from your `tsconfig.json`. You also need to add a line like this to `src/type-extensions.ts`,
before any import or other statements:

```typescript
/// <reference types="<plugin name>" />
```

Finally, you need to adapt the imports in your `src/type-extensions.ts` file.

Hardhat types are meant to be imported from `hardhat/types`, but when extending them,
you should import them from the module that declares them.

For example, if you want you use the `HardhatRuntimeEnvironment` type, you should import it with

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
```

To extend it, you should import the module that declares it, which is `hardhat/types/runtime`.

```typescript
import "hardhat/types/runtime";

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    newField: number;
  }
}
```

### How type extensions are loaded in Hardhat

Previously, type extensions were loaded by plugin users by adding references to a plugin-owned `type-extensions.d.ts` in their `tsconfig.json`.

Now, they're loaded by plugin users through an annotation in the user's config like this:

```typescript
/// <reference types="<npm package name>" />
```

Note that these annotations need to be at the beginning of the file, before any other statements.

## Adapting your `README.md`

Make sure to update the README to point to the new Hardhat site (https://usehardhat.com), and that the Typescript Support section has been updated.