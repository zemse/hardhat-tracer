# hardhat-tracer 🕵️

> This is a beta release. Some things might not work.

Allows you to see events, calls and storage operations when running your tests.

- [hardhat-tracer 🕵️](#hardhat-tracer-️)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Test](#test)
    - [Trace](#trace)
    - [Calldata decoder](#calldata-decoder)
    - [Address name tags](#address-name-tags)
    - [State overrides](#state-overrides)

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

```shell
npx hardhat test --trace # same as --vvv
npx hardhat test --fulltrace # same as --vvvv

npx hardhat test --v    # shows logs + calls for only failed txs
npx hardhat test --vv   # shows logs + calls + storage for only failed txs
npx hardhat test --vvv  # shows logs + calls for all txs
npx hardhat test --vvvv # shows logs + calls + storage for all txs

# specify opcode
npx hardhat test --v --opcodes ADD,SUB   # shows any opcode specified for only failed txs
npx hardhat test --vvv --opcodes ADD,SUB # shows any opcode specified for all txs
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

If you are just looking for a quick decode of calldata, return data or [Solidity"s Custom Error](https://blog.soliditylang.org/2021/04/21/custom-errors/):

```
$ npx hardhat decode --data 0x095ea7b300000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ERC20.approve(spender=0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45, amount=115792089237316195423570985008687907853269984665640564039457584007913129639935)


$ npx hardhat decode --data 0x3850c7bd --returndata 0x000000000000000000000000000000000000000000024d0fa9cd4ba6ff769172fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcdea1000000000000000000000000000000000000000000000000000000000000a244000000000000000000000000000000000000000000000000000000000000ff78000000000000000000000000000000000000000000000000000000000000ffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001

IUniswapV3Pool(0x0000000000000000000000000000000000000000).slot0() => (sqrtPriceX96: 2781762795090269932261746, tick: -205151, observationIndex: 41540, observationCardinality: 65400, observationCardinalityNext: 65535, feeProtocol: 0, unlocked: true)
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
    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": "Hunter",
    [someVariable]: "MyContract",
  },
},
```

### State overrides

These state overrides are applied when the EthereumJS/VM is created inside hardhat.

```ts
tracer: {
  stateOverrides: {
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
      storage: {
        "0": 100,
        "0x1abf42a573070203916aa7bf9118741d8da5f9522f66b5368aa0a2644f487b38": 0,
      },
      bytecode: "0x30FF",
      balance: parseEther("2"),
      nonce: 2
    },
  },
},
```
