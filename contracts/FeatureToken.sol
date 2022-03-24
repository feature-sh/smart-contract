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

contract FeatureToken is ERC20 {
    constructor() ERC20("Feature", "FEAT") {
        _mint(msg.sender, 1000000000000000000000000000); // 1000000000 FEAT
    }
}