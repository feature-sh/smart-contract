//SPDX-License-Identifier: Unlicense

/**
 *  @authors: [@n1c01a5]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor() ERC20("ERC20Mock", "ERC20M") {
        _mint(msg.sender, 10000000000000000000000); // 10000 ERC20M
    }
}