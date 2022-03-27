# hardhat-tracer 🕵️

Allows you to see events, calls and storage operations when running your tests.

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

### Test

Just add the `--trace` or `--fulltrace` after your test command.

```shell
npx hardhat test --trace      # shows logs + calls
npx hardhat test --traceFull  # shows logs + calls + sloads + sstores
```

<img width="1092" alt="Console testing" src="https://user-images.githubusercontent.com/22412996/160298216-f56b8244-ceb3-4a5a-86a8-0afb29734354.png">

### Trace

You can trace a mainnet transaction and ABIs/artifacts in your project will be used to decode the internal message calls.

```shell
npx hardhat trace --hash 0xTransactionHash # works if mainnet fork is on
npx hardhat trace --hash 0xTransactionHash --rpc https://url # must be archive node
```

### Address name tags

You can set display names / name tags for unknown addresses by adding new entry to `hre.tracer.nameTags` object in your test cases, see following example:

```ts
hre.tracer.nameTags[this.arbitrager.address] = "Arbitrager";
```
