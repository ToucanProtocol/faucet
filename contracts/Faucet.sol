//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Faucet is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant TIMEOUT_LIMIT = 30;
    uint256 public constant MAX_WITHDRAWAL_AMOUNT = 5 ether;

    mapping(address => uint256) private _lastWithdrawalTimes;

    /// @notice A function to get the Faucet's balances of multiple tokens at once
    /// @param erc20Addresses An array of ERC20 contract addresses
    /// @return An array of balances
    function getTokenBalances(
        address[] memory erc20Addresses
    ) public view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](erc20Addresses.length);
        for (uint256 i = 0; i < erc20Addresses.length; i++) {
            balances[i] = IERC20(erc20Addresses[i]).balanceOf(address(this));
        }
        return balances;
    }

    /// @notice deposit tokens from caller to Faucet
    /// @param erc20Address ERC20 contract address to be deposited
    /// @param amount amount to be deposited
    function deposit(address erc20Address, uint256 amount) public {
        IERC20(erc20Address).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
    }

    /// @notice checks if the Faucet is in a withdrawal timeout for the caller
    /// @return true if in timeout, false if not
    function checkIfWithdrawalTimeout() public view returns (bool) {
        return
            _lastWithdrawalTimes[msg.sender] > block.timestamp - TIMEOUT_LIMIT;
    }

    /// @notice withdraw tokens from Faucet to caller
    /// @param erc20Address ERC20 contract address to be withdrawn
    /// @param amount amount to be withdrawn
    function withdraw(address erc20Address, uint256 amount) public {
        require(!checkIfWithdrawalTimeout(), "Cannot withdraw that often");
        _lastWithdrawalTimes[msg.sender] = block.timestamp;

        require(amount <= MAX_WITHDRAWAL_AMOUNT, "Amount too high");

        IERC20(erc20Address).safeTransfer(msg.sender, amount);
    }

    /// @notice function that is only callable by owner and can withdraw as many tokens from this contract as they want
    /// @param erc20Address address of the token to be withdrawn
    /// @param amount amount of tokens to be withdrawn
    function ownerWithdraw(
        address erc20Address,
        uint256 amount
    ) public onlyOwner {
        IERC20(erc20Address).safeTransfer(msg.sender, amount);
    }
}
