// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract Hello {
    event WhatsUp(string message);
    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() {
        string memory hello = "Hello, world!";
        emit WhatsUp(hello);
    }
}
