//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {console} from "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IToucanContractRegistry} from "./interfaces/IToucanContractRegistry.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Faucet is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant TIMEOUT_LIMIT = 30;
    uint256 public constant MAX_WITHDRAWAL_AMOUNT = 5 ether;
    address public contractRegistry;
    mapping(address => bool) public isPoolEligible;
    mapping(address => uint256) private lastWithdrawalTimes;
    event Deposited(address erc20Addr, uint256 amount);
    event Withdrawn(address account, address erc20Addr, uint256 amount);

    constructor(address _contractRegistry, address[] memory poolAddresses) {
        contractRegistry = _contractRegistry;

        uint256 poolAddressesCount = poolAddresses.length;
        for (uint256 i = 0; i < poolAddressesCount; i++) {
            setPoolEligible(poolAddresses[i], true);
        }
    }

    /// @notice change the TCO2 contracts registry
    /// @param _address the new contract registry address
    function setToucanContractRegistry(
        address _address
    ) public virtual onlyOwner {
        contractRegistry = _address;
    }

    /// @notice allows the owner to set the eligibility of a pool
    /// @param _poolAddress the address of the pool
    /// @param _isPoolEligible eligibility flag
    function setPoolEligible(
        address _poolAddress,
        bool _isPoolEligible
    ) public virtual onlyOwner {
        isPoolEligible[_poolAddress] = _isPoolEligible;
    }

    /// @notice A function to get the Faucet's balances of multiple tokens at once
    /// @param _erc20Addresses An array of ERC20 contract addresses
    /// @return An array of balances
    function getTokenBalances(
        address[] memory _erc20Addresses
    ) public view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](_erc20Addresses.length);
        for (uint256 i = 0; i < _erc20Addresses.length; i++) {
            balances[i] = IERC20(_erc20Addresses[i]).balanceOf(address(this));
        }
        return balances;
    }

    /// @notice deposit tokens from caller to Faucet
    /// @param _erc20Address ERC20 contract address to be deposited
    /// @param _amount amount to be deposited
    function deposit(address _erc20Address, uint256 _amount) public {
        require(_checkEligible(_erc20Address), "Token rejected");

        IERC20(_erc20Address).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        emit Deposited(_erc20Address, _amount);
    }

    /// @notice checks if the Faucet is in a withdrawal timeout for the caller
    /// @return true if in timeout, false if not
    function checkIfWithdrawalTimeout() public view returns (bool) {
        return
            lastWithdrawalTimes[msg.sender] > block.timestamp - TIMEOUT_LIMIT;
    }

    /// @notice withdraw tokens from Faucet to caller
    /// @param _erc20Address ERC20 contract address to be withdrawn
    /// @param _amount amount to be withdrawn
    function withdraw(address _erc20Address, uint256 _amount) public {
        require(_checkEligible(_erc20Address), "Token rejected");
        require(!checkIfWithdrawalTimeout(), "Cannot withdraw that often");
        lastWithdrawalTimes[msg.sender] = block.timestamp;

        require(_amount <= MAX_WITHDRAWAL_AMOUNT, "Amount too high");

        IERC20(_erc20Address).safeTransfer(msg.sender, _amount);

        emit Withdrawn(msg.sender, _erc20Address, _amount);
    }

    /// @notice function that is only callable by owner and can withdraw as many tokens from this contract as they want
    /// @param _erc20Address address of the token to be withdrawn
    /// @param _amount amount of tokens to be withdrawn
    function ownerWithdraw(
        address _erc20Address,
        uint256 _amount
    ) public onlyOwner {
        IERC20(_erc20Address).safeTransfer(msg.sender, _amount);
    }

    function _checkEligible(
        address _erc20Address
    ) internal view returns (bool) {
        return
            IToucanContractRegistry(contractRegistry).checkERC20(
                _erc20Address
            ) || isPoolEligible[_erc20Address];
    }
}
