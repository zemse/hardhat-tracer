import { ethers } from "ethers";
import { network } from "hardhat";
import { EthereumProvider } from "hardhat/types";
import { StructLog, Call } from "./interface";

export async function getCalls(
  txHash: string,
  network: EthereumProvider
): Promise<Call> {
  const res = await network.send("debug_traceTransaction", [
    txHash,
    { tracer: "callTracer", reexec: 5000 },
  ]);
  if (res.structLogs) {
    // ganache
    return await parseGanacheStructLogs(txHash, network, res.structLogs);
  } else {
    // geth
    return res;
  }
}

async function parseGanacheStructLogs(
  txHash: string,
  network: EthereumProvider,
  structLogs: StructLog[]
): Promise<Call> {
  const tx = await network.send("eth_getTransactionByHash", [txHash]);
  const r = await network.send("eth_getTransactionReceipt", [txHash]);
  let call: Call = {
    type: "CALL",
    from: r.from,
    to: r.to ?? ethers.constants.AddressZero,
    value: r.value,
    gas: r.gas,
    gasUsed: r.gasUsed,
    input: tx.input,
    output: "0x",
    time: "",
    calls: [{}],
  };

  if (call.to === ethers.constants.AddressZero && r.contractAddress) {
    call.type = "CREATE";
    call.to = r.contractAddress;
  }

  // const tempCallArr: Call[] = [];

  const SYSTEM_OPCODES = [
    "CREATE",
    "CREATE2",
    "CALL",
    "DELEGATECALL",
    "STATICCALL",
    "CALLCODE",
    "RETURN",
    "REVERT",
  ];

  // callstack is the current recursive call stack of the EVM execution.
  const callstack = call.calls as Call[];
  console.log("cl", callstack.length);

  // descended tracks whether we've just descended from an outer transaction into
  // an inner call.
  let descended = false;

  // console.log(new Set<string>(structLogs.map((log) => log.op)));

  structLogs.forEach((log) => {
    /**
     * https://github.com/ethereum/go-ethereum/blob/053ed9cc847647a9b3ef707d0efe7104c4ab2a4c/eth/tracers/internal/tracers/call_tracer.js
     */

    // Capture any errors immediately
    if (log.error) {
      console.log("error op", log.op, log.error);
      return;
    }

    const isSysOp = SYSTEM_OPCODES.includes(log.op);
    if (isSysOp) {
      console.log("start sysop", log.op);
    }

    // Contract creation
    if (isSysOp && (log.op === "CREATE" || log.op === "CREATE2")) {
      const inOff = Number("0x" + log.stack[1]);
      const inEnd = inOff + Number("0x" + log.stack[2]);

      const call: Call = {
        type: log.op,
        // @ts-ignore
        from: log.contract,
        to: "",
        input: log.memory.slice(inOff, inEnd).join(" "),
        gas: "0x" + log.gas.toString(16),
        gasUsed: "0x" + log.gasCost.toString(16),
        value: "0x" + log.stack[0],
      };
      callstack.push(call);
      descended = true;
      return;
    }

    // If a contract is being self destructed, gather that as a subcall too
    if (isSysOp && log.op == "SELFDESTRUCT") {
      const left = callstack.length;
      if (callstack[left - 1].calls === undefined) {
        callstack[left - 1].calls = [];
      }
      callstack[left - 1].calls?.push({
        type: log.op,
        // @ts-ignore
        from: log.contract, // TODO: fix
        to: bytes32ToBytes20(log.stack[0]),
        gas: "0x" + log.gas.toString(16),
        gasUsed: log.gasCost.toString(16),
        // value: "0x" + db.getBalance(log.contract.getAddress()).toString(16),
      });
      return;
    }

    // If a new method invocation is being done, add to the call stack
    if (
      isSysOp &&
      (log.op == "CALL" ||
        log.op == "CALLCODE" ||
        log.op == "DELEGATECALL" ||
        log.op == "STATICCALL")
    ) {
      // console.log("hhhh", log.op);

      // Skip any pre-compile invocations, those are just fancy opcodes
      const to = bytes32ToBytes20(log.stack[1]);
      // TODO: Remove calls to precompiles
      // if (isPrecompiled(to)) {
      //   return;
      // }
      const off = log.op === "DELEGATECALL" || log.op === "STATICCALL" ? 0 : 1;

      const inOff = Number("0x" + log.stack[2 + off]);
      const inEnd = inOff + Number("0x" + log.stack[3 + off]);

      // Assemble the internal call report and store for completion
      const call: Call = {
        type: log.op,
        // @ts-ignore
        from: bytes32ToBytes20(log.stack[1]),
        to,
        input: log.memory.slice(inOff, inEnd).join(" "),
        _gasIn: "0x" + log.gas.toString(16),
        _gasCost: log.gasCost.toString(16),
        _outOff: log.stack[4 + off],
        _outLen: log.stack[5 + off],
      };
      if (log.op !== "DELEGATECALL" && log.op !== "STATICCALL") {
        call.value = "0x" + log.stack[2];
      }
      callstack.push(call);
      console.log("callstack", callstack);
      descended = true;
      return;
    }

    // If we've just descended into an inner call, retrieve it's true allowance. We
    // need to extract if from within the call as there may be funky gas dynamics
    // with regard to requested and actually given gas (2300 stipend, 63/64 rule).
    if (descended) {
      if (log.depth >= callstack.length) {
        callstack[callstack.length - 1].gas = "0x" + log.gas.toString(16);
      } else {
        // TODO(karalabe): The call was made to a plain account. We currently don't
        // have access to the true gas amount inside the call and so any amount will
        // mostly be wrong since it depends on a lot of input args. Skip gas for now.
      }
      descended = false;
    }

    // If an existing call is returning, pop off the call stack
    if (isSysOp && log.op == "REVERT") {
      // TODO: Look for adding revert reason
      callstack[callstack.length - 1].error = "execution reverted";
      return;
    }

    if (log.depth == callstack.length - 1) {
      // Pop off the last call and get the execution results
      const call = callstack.pop();

      if (call === undefined) {
        return;
      }

      if (call._gasIn !== undefined && call._gasCost !== undefined) {
        if (call.type == "CREATE" || call.type == "CREATE2") {
          // If the call was a CREATE, retrieve the contract address and output code
          call.gasUsed =
            "0x" + (+call._gasIn - +call._gasCost - log.gas).toString(16);
          delete call._gasIn;
          delete call._gasCost;

          const ret = log.stack[0];
          if (ret !== ethers.constants.HashZero) {
            call.to = bytes32ToBytes20(ret);
            // call.output = toHex(db.getCode(toAddress(ret.toString(16))));
          } else if (call.error === undefined) {
            call.error = "internal failure"; // TODO(karalabe): surface these faults somehow
          }
        } else {
          // If the call was a contract call, retrieve the gas usage and output
          if (call.gas !== undefined) {
            call.gasUsed =
              "0x" +
              (+call._gasIn - +call._gasCost + +call.gas - log.gas).toString(
                16
              );
          }
          var ret = log.stack[0];
          if (
            ret !== ethers.constants.HashZero &&
            call._outOff !== undefined &&
            call._outLen !== undefined
          ) {
            call.output = log.memory
              .slice(+call._outOff, +call._outOff + +call._outLen)
              .join(" ");
          } else if (call.error === undefined) {
            call.error = "internal failure"; // TODO(karalabe): surface these faults somehow
          }
          delete call._gasIn;
          delete call._gasCost;
          delete call._outOff;
          delete call._outLen;
        }
      }
      // if (call.gas !== undefined) {
      //   call.gas = "0x" + call.gas.toString(16);
      // }
      // Inject the call into the previous one
      var left = callstack.length;
      if (left !== 0) {
        if (callstack[left - 1].calls === undefined) {
          callstack[left - 1].calls = [];
        }
        callstack[left - 1].calls?.push(call);
      }
    }
    //
    //
    //
    // const stack = [...log.stack];
    // const gas = "0x" + stack.pop();
    // let address = ethers.utils.hexZeroPad(
    //   ethers.utils.hexStripZeros("0x" + stack.pop()),
    //   20
    // );

    // // const formattedValue = ethers.utils.formatEther(
    // //   ethers.BigNumber.from("0x" + stack.pop())
    // // );

    // const value = "0x" + stack.pop();

    // // console.log(
    // //   `Trace${log.op}: ${
    // //     fromArr.slice(-2)[0]
    // //   } to ${address}: ${formattedValue} (${+("0x" + gas)} gas)`
    // // );

    // const _call = {
    //   type: log.op as "CALL",
    //   from: fromRef.slice(-2)[0].to,
    //   to: address,
    //   value,
    //   gas,
    //   gasUsed: gas,
    //   input: "0x",
    //   output: "0x",
    //   time: "",
    //   calls: [],
    // };

    // // console.log(log[3].op, log[0].op, log[1].op, log[2].op);
    // if (log.op === "RETURN") {
    //   // console.log(COLOR_DIM, "RETURN", COLOR_RESET);
    //   fromRef.pop();
    //   return;
    // } else {
    //   fromRef.slice(-2)[0].calls.push(_call);
    //   fromRef.push(_call);
    // }
  });

  // console.log("tempCallArr", tempCallArr);

  return call;
}

// .filter((log, i) =>
//   // log.op === "CALL" ||
//   // log.op === "STATICCALL" ||
//   // log.op === "DELEGATECALL" ||
//   // log.op === "SELFDESTRUCT" ||
//   // log.op === "RETURN"
//   ["CALL", "STATICCALL", "DELEGATECALL", "SELFDESTRUCT", "RETURN"].includes(
//     log.op
//   )
// )

function bytes32ToBytes20(input: string) {
  if (input.slice(0, 2) !== "0x") {
    input = "0x" + input;
  }
  return ethers.utils.hexZeroPad(ethers.utils.hexStripZeros(input), 20);
}
