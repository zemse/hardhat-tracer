// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "hardhat/console.sol";

contract Hello {
    event WhatsUp(string message);
    event Transfer(address indexed from, address indexed to, uint256 value);

    uint256 heyy;

    constructor() {
        emit WhatsUp("Hello, world!");
    }

    function hit() external {
        Child c = new Child();
        emit WhatsUp(c.hi());
        Child c2 = new Child{salt: bytes32("hello")}();
        emit WhatsUp(c2.hi());
        this.dm();
        heyy = 23;
        console.log(
            "Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!Hey WTF!"
        );
        emit WhatsUp(c.hi());
    }

    function crash() external {
        Child c = new Child();

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

    function kick() public view returns (string memory) {
        this.reverts();
    }

    function reverts() public pure returns (string memory) {
        revert("kick");
    }
}

contract Child {
    function hi() public pure returns (string memory) {
        return "Heya!";
    }

    function kick() public pure returns (string memory) {
        revert("kick");
    }
}
