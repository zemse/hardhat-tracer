// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";

contract Hello {
    event WhatsUp(string message);
    event WhatsUp2(uint256 no);
    event Transfer(address indexed from, address indexed to, uint256 value);

    uint256 heyy = 3;

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

    function hit(Person memory person, uint256 time) external payable {
        Child c = new Child(address(0));
        emit WhatsUp(c.hi());
        Child c2 = new Child{salt: bytes32("hello")}(address(0));
        emit WhatsUp(c2.hi());
        this.dm();
        heyy = 23;
        console.log(
            "Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!"
        );
        emit WhatsUp(c.hi());
    }

    function crash() external {
        Child c = new Child(address(0));

        console.log(
            "Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!"
        );
        c.kick();
    }

    function dm() external view returns (string memory) {
        return this.dm2("Heya!", msg.sender);
    }

    function dm2(string memory hello, address yo)
        external
        pure
        returns (string memory)
    {
        return hello;
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
        this.reverts(100);
        return _heyy;
    }

    function reverts(uint256 x) public pure returns (uint256) {
        uint256 y = 1 - x;
        // revert("kick");
        return y;
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
}
