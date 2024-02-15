<!-- omit from toc -->
# hardhat-tracer 🕵️

Allows you to see events, calls and storage operations when running your tests.

- [Installation](#installation)
- [Usage](#usage)
  - [Test](#test)
  - [Trace Tx](#trace-tx)
  - [Trace Call](#trace-call)
  - [Calldata decoder](#calldata-decoder)
  - [Address name tags](#address-name-tags)
  - [State overrides](#state-overrides)
  - [Chai util](#chai-util)
  - [Programatically access trace info](#programatically-access-trace-info)
  - [Register `--trace` option to custom tasks](#register---trace-option-to-custom-tasks)
  - [Print debug logs](#print-debug-logs)
  - [Config parameters](#config-parameters)

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
npx hardhat test --traceError # prints calls for failed txs
npx hardhat test --fulltraceError # prints calls and storage ops for failed txs
npx hardhat test --trace # prints calls for all txs
npx hardhat test --fulltrace # prints calls and storage ops for all txs

npx hardhat test --v    # same as --traceError
npx hardhat test --vv   # same as --fulltraceError
npx hardhat test --vvv  # same as --trace
npx hardhat test --vvvv # same as --fulltrace

# specify opcode
npx hardhat test --v --opcodes ADD,SUB   # shows any opcode specified for only failed txs
npx hardhat test --vvv --opcodes ADD,SUB # shows any opcode specified for all txs
```

<img width="1092" alt="Console testing" src="https://user-images.githubusercontent.com/22412996/160298216-f56b8244-ceb3-4a5a-86a8-0afb29734354.png">

You can just enable trace some code snippet in your tests:

```ts
hre.tracer.enabled = true;
await myContract.doStuff(val2);
hre.tracer.enabled = false;
```

### Trace Tx

You can trace a mainnet transaction and ABIs/artifacts in your project and 4byte directory will be used to decode the internal message calls.

```shell
npx hardhat trace --hash 0xTransactionHash # works if mainnet fork is on
npx hardhat trace --hash 0xTransactionHash --rpc https://url # must be archive node
```

> Note: you can also use [state overrides](#state-overrides) to override any state, e.g. things like adding console logs to the contracts involved in the trace or change balances.

### Trace Call

You can trace a call on mainnet and ABIs/artifacts in your project and 4byte directory will be used to decode the internal message calls.

```shell
npx hardhat tracecall --to 0xAddr --data 0xData --from 0xAddr --value 123 # works if mainnet fork is on
npx hardhat tracecall --to 0xAddr --data 0xData --opcodes SLOAD --rpc https://url --blocknumber 1200000 # must be archive node
```

> Note: you can also use [state overrides](#state-overrides) to override any state, e.g. things like adding console logs to the contracts involved in the trace or change balances.

### Calldata decoder

If you are just looking for a quick decode of calldata, return data or [Solidity"s Custom Error](https://blog.soliditylang.org/2021/04/21/custom-errors/):

```
$ npx hardhat decode --data 0x095ea7b300000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
ERC20.approve(spender=0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45, amount=115792089237316195423570985008687907853269984665640564039457584007913129639935)


$ npx hardhat decode --data 0x3850c7bd --returndata 0x000000000000000000000000000000000000000000024d0fa9cd4ba6ff769172fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcdea1000000000000000000000000000000000000000000000000000000000000a244000000000000000000000000000000000000000000000000000000000000ff78000000000000000000000000000000000000000000000000000000000000ffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001

IUniswapV3Pool.slot0() => (sqrtPriceX96: 2781762795090269932261746, tick: -205151, observationIndex: 41540, observationCardinality: 65400, observationCardinalityNext: 65535, feeProtocol: 0, unlocked: true)
```

For decoding logs

```
$ npx hardhat decodelog 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef 0xdCB90A71Db48D673A9A483c9F355EBaE93F66A86 0x0D0707963952f2fBA59dD06f2b425ace40b492Fe --data 0x00000000000000000000000000000000000000000000054b40b1f852bd800000
Transfer(src: 0xdCB90A71Db48D673A9A483c9F355EBaE93F66A86, dst: 0x0D0707963952f2fBA59dD06f2b425ace40b492Fe, wad: 24999999999999997902848)
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
    [someAddress]: {
      bytecode: "MyContract" // will compile and use the bytecode and link any libraries needed
    }
  },
},
```

### Chai util

Allows to add a test case to check whether last tx did an internal message call.

```ts
expect(hre.tracer.lastTrace()).to.have.messageCall(
  await contract.populateTransaction.getData(),
  {
    returnData: defaultAbiCoder.encode(["uint"], ["1234"]),
    from: otherContract.address,
    isDelegateCall: true,
    isStaticCall: true,
    isSuccess: true,
  }
);
```

### Programatically access trace info

You can programatically access detail information about previous traces in your test cases.

```ts
import {CallItem} from 'hardhat-tracer'

// can be a read call, estimate gas, write tx
await contract.method()

// traverse to the right location in the trace and extract the gasUsed
const trace1 = hre.tracer.lastTrace()!;
const callItem = trace1.top?.children?.[0].children?.[0] as CallItem;
const gasUsed = callItem.params.gasUsed!;
```

If you are running `npx hardhat node --trace`, then you can also access last trace using the rpc call `tracer_lastTrace`.

### Register `--trace` option to custom tasks

```ts
// hardhat config
tracer: {
  tasks: ["deploy", "mycooltask"],
},
```

This allows to run

```
npx hardhat deploy --trace
npx hardhat mycooltask --trace
```

Please note that hardhat-tracer will only be able to print trace for things that run on the EthereumJS VM inside Hardhat Network. So if your custom task is executing evm code somewhere else e.g. deploying on live network (instead of hardhat network), then this option would not be able to print trace.

### Print debug logs

Set the `DEBUG` env variable to `hardhat-tracer:*`. This will print debug logs related to internal logic in hardhat-tracer for debugging purposes.

```sh
DEBUG=hardhat-tracer:* npx hardhat test --trace
```

### Config parameters

List of supported configs is available in [TracerEnvUser](./src/types.ts).