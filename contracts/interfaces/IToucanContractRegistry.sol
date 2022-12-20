//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IToucanContractRegistry {
    function checkERC20(address _address) external view returns (bool);
}
