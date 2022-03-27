# hardhat-tracer 🕵️

Allows you to see events, calls and storage ops when running your tests.

## Installation

**Step 1:** Install the package

```
npm i hardhat-tracer
```

**Step 2:** Add to your `hardhat.config.js` file

```
require("hardhat-tracer");
```

## Usage

Just add the `--trace` or `--traceFull` after your test command.

```shell
npx hardhat test --trace      # shows logs + calls
npx hardhat test --traceFull  # shows logs + calls + sloads + sstores
```

<img width="1177" alt="Console testing" src="https://user-images.githubusercontent.com/22412996/132125751-20d5d006-2d54-4901-bfc5-db0c8d5495b0.png">

### Address name tags

You can set display names / name tags for unknown addresses by adding new entry to `hre.tracer.nameTags` object in your test cases, see following example:

```ts
hre.tracer.nameTags[this.arbitrager.address] = "Arbitrager";
```
