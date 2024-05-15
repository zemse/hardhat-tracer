// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import {Lib} from "./Lib.sol";

import "hardhat/console.sol";

contract Hello {
  event WhatsUp(string message);
  event WhatsUp2(uint256 no);
  event Transfer(address indexed from, address indexed to, uint256 value);

  error Errrrr();

  uint256 heyy = 3;

  mapping(address => uint256) hello_world;

  struct Person {
    string name;
    uint256 age;
    Props props;
  }

  struct Props {
    uint256 id;
    string name;
    uint256 age;
  }

  constructor() {
    emit WhatsUp("Hello, world!");
  }

  fallback() external {
    revert("gg");
  }

  struct Info {
    uint256 id;
    uint256 id2;
  }

  function hi2(Info[] memory) public {
    assembly {
      mstore(0, 0)
      let val := msize()
      mstore8(0, val)
    }
    Child c = new Child(address(0));
    emit WhatsUp(c.hi());
    address(c).delegatecall(abi.encodeWithSignature("hi()"));
    address(c).delegatecall(abi.encodeWithSignature("unknown-function()"));
    Lib.add(1, 2);
    revert("hello");
  }

  function hit(Person memory person, uint256 time) external payable returns (uint) {
    Child c = new Child(address(0));
    emit WhatsUp(c.hi());
    this.dm();
    heyy = 23;
    console.log(
      "Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!"
    );
    emit WhatsUp(c.hi());
    // selfdestruct(payable(0));
    return time;
  }

  function crash() external {
    Child c = new Child(address(0));

    console.log(
      "Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!"
    );
    c.kick();
  }

  function dm() external view returns (string memory) {
    this.getData();
    return this.dm2("Heya!", msg.sender);
  }

  function dm2(
    string memory hello,
    address yo
  ) external pure returns (string memory) {
    return hello;
  }

  function getData() public view returns (uint256) {
    return 1234;
  }

  function kick() public view returns (uint256) {
    uint256 _heyy = heyy;
    // emit WhatsUp2(_heyy);
    this.reverts(_heyy);
    return _heyy;
  }

  function kick2() public returns (uint256) {
    uint256 _heyy = heyy;
    emit WhatsUp2(_heyy);
    // this.reverts(100);
    return _heyy;
  }

  function reverts(uint256 x) public pure returns (uint256) {
    uint256 y = 1 - x;
    // revert("kick");
    return y;
  }

  function firstCall() public returns (uint256) {
    assembly {
      let val := sload(1)
      sstore(0, add(val, 1))
    }
    (, bytes memory ret) = address(this).staticcall(
      abi.encodeCall(this.secondStaticCall, ())
    );
    assembly {
      sstore(0, 1)
      return(add(32, ret), mload(ret))
    }
  }

  function delegatedShoot() public {
    address(0xC611D00000000000000000000000001234567890).delegatecall(
      abi.encodeCall(Child.shoot, ())
    );
  }

  function secondStaticCall() public returns (uint256) {
    (, bytes memory ret) = address(this).delegatecall(
      abi.encodeCall(this.thirdDelegateCall, ())
    );
    assembly {
      return(add(32, ret), mload(ret))
    }
  }

  function thirdDelegateCall() public view returns (uint256) {
    return 1234;
  }

  function playWithOpcodes() public {
    address someAddr = address(this);
    hello_world[someAddr] = 420;
    assembly {
      let size := extcodesize(someAddr)
      let h := extcodehash(someAddr)

      // to prevent soldity from removing dead code above
      if iszero(h) {
        revert(0, size)
      }
    }
  }

  function precompiles() public {
    address(1).call(
      abi.encode(
        0x48289ed753a0fe1709d6edda79891a80a4dda959263b0894bcb3076796e42064,
        28,
        0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
        0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34
      )
    );
    address(2).call(
      abi.encode(
        0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
        0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34
      )
    );
    address(3).call(
      abi.encode(
        0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
        0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34
      )
    );
    address(4).call(
      abi.encode(
        0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
        0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34
      )
    );
    // address(5).call(
    //   abi.encode(
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34
    //   )
    // );
    // address(6).call(
    //   abi.encode(
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34,
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34
    //   )
    // );
    // address(7).call(
    //   abi.encode(
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34,
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59
    //     // 0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34
    //   )
    // );
    // address(8).call(
    //   abi.encode(
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34,
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34
    //   )
    // );
    // address(9).call(
    //   abi.encode(
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34,
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x3786f23f9e6dd675c566d80ff375be8f2f7acd30b39509752a6312fc344acd59,
    //     0x296d7e5d79e3ccb66a5b53f12c135a4bb8d39f98ba02fa35adde4f13d2982e34
    //   )
    // );
  }
}

contract Child {
  address temp;

  constructor(address hello) {
    temp = hello;
  }

  function hi() public pure returns (string memory) {
    return "Heya!";
  }

  function kick() public pure returns (string memory) {
    // 1 - 2;
    revert("kick");
  }

  event Bullet(uint a);

  function shoot() public {
    emit Bullet(4);
  }
}
