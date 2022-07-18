# hardhat-tracer 🕵️

Allows you to see events, calls and storage operations when running your tests.

- [Installation](#installation)
- [Usage](#usage)
  - [Test](#test): See debug trace when running test
  - [Trace](#trace): Task to generate call tree for a transaction
  - [Calldata decoder](#calldata-decoder): Task to simply decode an encoded data
  - [Address name tags](#address-name-tags): Set alias for addresses with name

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
npx hardhat test --fulltrace  # shows logs + calls + sloads + sstores
npx hardhat test --trace --opcodes ADD,SUB # shows any opcode specified
```

<img width="1092" alt="Console testing" src="https://user-images.githubusercontent.com/22412996/160298216-f56b8244-ceb3-4a5a-86a8-0afb29734354.png">

You can just enable trace some code snippet in your tests:

```ts
hre.tracer.enable = true;
await myContract.doStuff(val2);
hre.tracer.enable = false;
```

### Trace

You can trace a mainnet transaction and ABIs/artifacts in your project will be used to decode the internal message calls.

```shell
npx hardhat trace --hash 0xTransactionHash # works if mainnet fork is on
npx hardhat trace --hash 0xTransactionHash --rpc https://url # must be archive node
```

### Calldata decoder

If you are just looking for a quick decode of calldata or [Solidity's Custom Error](https://blog.soliditylang.org/2021/04/21/custom-errors/):

```
$ npx hardhat decode --data 0x095ea7b300000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ERC20.approve(spender=0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45, amount=115792089237316195423570985008687907853269984665640564039457584007913129639935)
```

### Address name tags

You can set display names / name tags for unknown addresses by adding new entry to `hre.tracer.nameTags` object in your test cases, see following example:

```ts
hre.tracer.nameTags[this.arbitrager.address] = "Arbitrager";
```

or can be set in hardhat config

```ts
tracer: {
    nameTags: {
        '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': 'Hunter',
        [someVariable]: 'MyContract',
    },
},
```
