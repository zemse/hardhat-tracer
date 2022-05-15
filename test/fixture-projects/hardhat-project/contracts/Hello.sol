// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract Hello {
    event WhatsUp(string message);
    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() {
        emit WhatsUp("Hello, world!");
    }
}
